#!/bin/bash

# SSL Certificate Setup Script for ContratoRápido
# Generates SSL certificates using Let's Encrypt or creates self-signed certificates for testing

set -e

echo "🔐 SSL Certificate Setup for ContratoRápido"
echo "============================================="

DOMAIN="contratorapido.app.br"
EMAIL="admin@contratorapido.app.br"
SSL_DIR="./ssl"
CERTS_DIR="$SSL_DIR/certs"
PRIVATE_DIR="$SSL_DIR/private"

# Create SSL directories
echo "📁 Creating SSL directories..."
mkdir -p "$CERTS_DIR" "$PRIVATE_DIR"

# Set secure permissions
chmod 700 "$PRIVATE_DIR"
chmod 755 "$CERTS_DIR"

echo "✅ SSL directories created with secure permissions"

# Function to generate self-signed certificate for testing
generate_self_signed() {
    echo "🔧 Generating self-signed certificates for testing..."
    
    # Main domain certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PRIVATE_DIR/contratorapido.app.br.key" \
        -out "$CERTS_DIR/contratorapido.app.br.crt" \
        -subj "/C=BR/ST=SP/L=Sao Paulo/O=ContratoRápido/CN=contratorapido.app.br" \
        -extensions v3_req \
        -config <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=BR
ST=SP
L=Sao Paulo
O=ContratoRápido
CN=contratorapido.app.br

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = contratorapido.app.br
DNS.2 = www.contratorapido.app.br
DNS.3 = admin.contratorapido.app.br
DNS.4 = api.contratorapido.app.br
EOF
)
    
    # Default certificate for catch-all server
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PRIVATE_DIR/default.key" \
        -out "$CERTS_DIR/default.crt" \
        -subj "/C=BR/ST=SP/L=Sao Paulo/O=Default/CN=default"
    
    echo "✅ Self-signed certificates generated"
    echo "⚠️  Remember to replace with real certificates for production!"
}

# Function to setup Let's Encrypt certificates
setup_letsencrypt() {
    echo "🌐 Setting up Let's Encrypt certificates..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot
        elif command -v brew &> /dev/null; then
            brew install certbot
        else
            echo "❌ Could not install certbot. Please install manually."
            exit 1
        fi
    fi
    
    echo "🔧 Obtaining certificates from Let's Encrypt..."
    
    # Stop nginx if running to free port 80
    docker-compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true
    
    # Obtain certificates for all subdomains
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "admin.$DOMAIN" \
        -d "api.$DOMAIN"
    
    if [ $? -eq 0 ]; then
        echo "✅ Let's Encrypt certificates obtained successfully"
        
        # Copy certificates to our SSL directory
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/contratorapido.app.br.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$PRIVATE_DIR/contratorapido.app.br.key"
        
        # Set proper permissions
        chmod 644 "$CERTS_DIR/contratorapido.app.br.crt"
        chmod 600 "$PRIVATE_DIR/contratorapido.app.br.key"
        
        echo "✅ Certificates copied to SSL directory"
        
        # Setup auto-renewal
        setup_auto_renewal
        
    else
        echo "❌ Failed to obtain Let's Encrypt certificates"
        echo "💡 Falling back to self-signed certificates..."
        generate_self_signed
    fi
}

# Function to setup automatic certificate renewal
setup_auto_renewal() {
    echo "🔄 Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "$SSL_DIR/renew-certs.sh" << 'EOF'
#!/bin/bash

# Certificate renewal script
DOMAIN="contratorapido.app.br"
SSL_DIR="/path/to/your/ssl"  # Update this path
CERTS_DIR="$SSL_DIR/certs"
PRIVATE_DIR="$SSL_DIR/private"

echo "$(date): Starting certificate renewal process..."

# Stop nginx
docker-compose -f docker-compose.prod.yml stop nginx

# Renew certificates
certbot renew --quiet

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/contratorapido.app.br.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$PRIVATE_DIR/contratorapido.app.br.key"
    chmod 644 "$CERTS_DIR/contratorapido.app.br.crt"
    chmod 600 "$PRIVATE_DIR/contratorapido.app.br.key"
    echo "$(date): Certificates renewed and copied"
else
    echo "$(date): No certificate renewal needed"
fi

# Restart nginx
docker-compose -f docker-compose.prod.yml start nginx

echo "$(date): Certificate renewal process completed"
EOF
    
    chmod +x "$SSL_DIR/renew-certs.sh"
    
    # Add to crontab (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 0,12 * * * $PWD/$SSL_DIR/renew-certs.sh >> /var/log/cert-renewal.log 2>&1") | crontab -
    
    echo "✅ Automatic renewal configured (runs twice daily)"
}

# Function to validate certificates
validate_certificates() {
    echo "🔍 Validating SSL certificates..."
    
    CERT_FILE="$CERTS_DIR/contratorapido.app.br.crt"
    KEY_FILE="$PRIVATE_DIR/contratorapido.app.br.key"
    
    if [ ! -f "$CERT_FILE" ]; then
        echo "❌ Certificate file not found: $CERT_FILE"
        return 1
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        echo "❌ Private key file not found: $KEY_FILE"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in "$CERT_FILE" -noout -checkend 86400; then
        echo "✅ Certificate is valid and not expiring within 24 hours"
    else
        echo "⚠️  Certificate is expiring soon or invalid"
    fi
    
    # Check certificate details
    echo ""
    echo "📋 Certificate Details:"
    echo "======================="
    openssl x509 -in "$CERT_FILE" -noout -subject -dates -issuer
    
    # Check SAN (Subject Alternative Names)
    echo ""
    echo "🏷️  Subject Alternative Names:"
    openssl x509 -in "$CERT_FILE" -noout -text | grep -A 1 "Subject Alternative Name" || echo "None found"
    
    echo ""
    echo "✅ Certificate validation complete"
}

# Function to create nginx proxy_params file
create_proxy_params() {
    echo "📝 Creating nginx proxy_params file..."
    
    mkdir -p ./nginx
    
    cat > ./nginx/proxy_params << 'EOF'
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;

# Additional headers for security
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;
EOF
    
    echo "✅ Nginx proxy_params created"
}

# Main setup function
main_setup() {
    echo "🎯 Choose SSL certificate setup method:"
    echo "1) Self-signed certificates (for testing)"
    echo "2) Let's Encrypt certificates (for production)"
    echo "3) Skip certificate generation (certificates already exist)"
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            generate_self_signed
            ;;
        2)
            read -p "Enter your email for Let's Encrypt notifications: " user_email
            if [ ! -z "$user_email" ]; then
                EMAIL="$user_email"
            fi
            setup_letsencrypt
            ;;
        3)
            echo "⏭️  Skipping certificate generation"
            ;;
        *)
            echo "❌ Invalid choice. Defaulting to self-signed certificates."
            generate_self_signed
            ;;
    esac
    
    # Always create proxy_params file
    create_proxy_params
    
    # Validate certificates if they exist
    if [ -f "$CERTS_DIR/contratorapido.app.br.crt" ]; then
        validate_certificates
    fi
}

# Security hardening
harden_ssl_files() {
    echo "🔒 Applying security hardening to SSL files..."
    
    # Set restrictive permissions
    find "$SSL_DIR" -type f -name "*.key" -exec chmod 600 {} \;
    find "$SSL_DIR" -type f -name "*.crt" -exec chmod 644 {} \;
    find "$SSL_DIR" -type d -exec chmod 755 {} \;
    
    # Set ownership (if running as root)
    if [ "$(id -u)" = "0" ]; then
        chown -R root:root "$SSL_DIR"
    fi
    
    echo "✅ SSL files security hardened"
}

# DNS verification helper
check_dns() {
    echo "🌐 Checking DNS configuration for $DOMAIN..."
    
    for subdomain in "" "www" "admin" "api"; do
        if [ -z "$subdomain" ]; then
            check_domain="$DOMAIN"
        else
            check_domain="$subdomain.$DOMAIN"
        fi
        
        echo -n "Checking $check_domain... "
        if nslookup "$check_domain" > /dev/null 2>&1; then
            echo "✅"
        else
            echo "❌"
            echo "⚠️  DNS not configured for $check_domain"
        fi
    done
}

# Help function
show_help() {
    echo "SSL Setup Script for ContratoRápido"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --self-signed     Generate self-signed certificates"
    echo "  --letsencrypt     Setup Let's Encrypt certificates"
    echo "  --validate        Validate existing certificates"
    echo "  --check-dns       Check DNS configuration"
    echo "  --renew           Renew Let's Encrypt certificates"
    echo "  --help            Show this help message"
    echo ""
    echo "If no option is provided, interactive setup will run."
}

# Parse command line arguments
case "${1:-}" in
    --self-signed)
        generate_self_signed
        create_proxy_params
        harden_ssl_files
        ;;
    --letsencrypt)
        setup_letsencrypt
        create_proxy_params
        harden_ssl_files
        ;;
    --validate)
        validate_certificates
        ;;
    --check-dns)
        check_dns
        ;;
    --renew)
        if [ -f "$SSL_DIR/renew-certs.sh" ]; then
            "$SSL_DIR/renew-certs.sh"
        else
            echo "❌ Renewal script not found. Run --letsencrypt first."
        fi
        ;;
    --help)
        show_help
        ;;
    "")
        main_setup
        harden_ssl_files
        ;;
    *)
        echo "❌ Unknown option: $1"
        show_help
        exit 1
        ;;
esac

echo ""
echo "🎉 SSL setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update DNS records to point to your server:"
echo "   - contratorapido.app.br A record → Your server IP"
echo "   - www.contratorapido.app.br CNAME → contratorapido.app.br"
echo "   - admin.contratorapido.app.br CNAME → contratorapido.app.br"
echo "   - api.contratorapido.app.br CNAME → contratorapido.app.br"
echo ""
echo "2. Start the production environment:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Test HTTPS access:"
echo "   https://contratorapido.app.br"
echo "   https://admin.contratorapido.app.br"
echo ""
echo "📁 SSL files location:"
echo "   Certificates: $CERTS_DIR/"
echo "   Private keys: $PRIVATE_DIR/"