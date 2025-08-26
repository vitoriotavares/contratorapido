#!/bin/bash

# Local Website Server for Development and Review
# Serves the website locally for testing and review

set -e

echo "🌐 Starting Local Website Server"
echo "================================"

WEBSITE_DIR="./website"
PORT=${1:-8080}

# Check if website directory exists
if [ ! -d "$WEBSITE_DIR" ]; then
    echo "❌ Website directory not found: $WEBSITE_DIR"
    exit 1
fi

echo "📁 Website directory: $WEBSITE_DIR"
echo "🔌 Port: $PORT"

# Function to serve with Python
serve_with_python() {
    echo "🐍 Using Python HTTP server..."
    cd "$WEBSITE_DIR"
    
    # Check Python version and use appropriate command
    if command -v python3 &> /dev/null; then
        echo "✅ Starting Python 3 HTTP server on port $PORT"
        python3 -m http.server $PORT
    elif command -v python &> /dev/null; then
        echo "✅ Starting Python 2 HTTP server on port $PORT"
        python -m SimpleHTTPServer $PORT
    else
        echo "❌ Python not found"
        return 1
    fi
}

# Function to serve with Node.js
serve_with_node() {
    echo "📦 Using Node.js HTTP server..."
    
    # Check if http-server is installed globally
    if command -v http-server &> /dev/null; then
        echo "✅ Starting http-server on port $PORT"
        cd "$WEBSITE_DIR"
        http-server -p $PORT -o
        return 0
    fi
    
    # Check if npx is available and install http-server
    if command -v npx &> /dev/null; then
        echo "📥 Installing and running http-server via npx..."
        cd "$WEBSITE_DIR"
        npx http-server -p $PORT -o
        return 0
    fi
    
    echo "❌ Node.js server options not available"
    return 1
}

# Function to serve with PHP
serve_with_php() {
    echo "🐘 Using PHP built-in server..."
    if command -v php &> /dev/null; then
        echo "✅ Starting PHP server on port $PORT"
        cd "$WEBSITE_DIR"
        php -S localhost:$PORT
        return 0
    else
        echo "❌ PHP not found"
        return 1
    fi
}

# Function to serve with Docker (nginx)
serve_with_docker() {
    echo "🐳 Using Docker with Nginx..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found"
        return 1
    fi
    
    echo "✅ Starting Nginx container on port $PORT"
    
    # Create temporary nginx.conf for local serving
    cat > /tmp/nginx-local.conf << EOF
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # MIME types for local development
    location ~* \.(css|js)$ {
        add_header Content-Type text/css;
    }
}
EOF

    docker run --rm -it \
        -p $PORT:80 \
        -v "$(pwd)/$WEBSITE_DIR:/usr/share/nginx/html:ro" \
        -v "/tmp/nginx-local.conf:/etc/nginx/conf.d/default.conf:ro" \
        nginx:alpine
}

# Function to open browser
open_browser() {
    local url="http://localhost:$PORT"
    echo ""
    echo "🌐 Website available at: $url"
    echo ""
    echo "📱 Test pages:"
    echo "   Main page: $url"
    echo "   Privacy Policy: $url/privacy-policy.html"
    echo "   Terms of Service: $url/terms-of-service.html"
    echo ""
    
    # Try to open browser automatically
    if command -v open &> /dev/null; then
        # macOS
        sleep 2
        open "$url"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        sleep 2
        xdg-open "$url"
    elif command -v start &> /dev/null; then
        # Windows
        sleep 2
        start "$url"
    else
        echo "💡 Open your browser and navigate to: $url"
    fi
}

# Function to show available options
show_options() {
    echo "Choose a server method:"
    echo "1) Python HTTP server (recommended)"
    echo "2) Node.js http-server"
    echo "3) PHP built-in server"
    echo "4) Docker with Nginx"
    echo "5) Auto-detect best option"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1) serve_with_python && open_browser ;;
        2) serve_with_node && open_browser ;;
        3) serve_with_php && open_browser ;;
        4) serve_with_docker && open_browser ;;
        5) auto_detect ;;
        *) echo "❌ Invalid choice"; exit 1 ;;
    esac
}

# Function to auto-detect best server option
auto_detect() {
    echo "🔍 Auto-detecting best server option..."
    
    if serve_with_python; then
        open_browser
    elif serve_with_node; then
        open_browser
    elif serve_with_php; then
        open_browser
    elif serve_with_docker; then
        open_browser
    else
        echo "❌ No suitable HTTP server found!"
        echo ""
        echo "💡 Install one of these options:"
        echo "   • Python: brew install python3 (macOS) or apt-get install python3 (Linux)"
        echo "   • Node.js: brew install node (macOS) or apt-get install nodejs npm (Linux)"
        echo "   • PHP: brew install php (macOS) or apt-get install php (Linux)"
        echo "   • Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
}

# Parse command line arguments
case "${2:-auto}" in
    python)
        serve_with_python && open_browser
        ;;
    node)
        serve_with_node && open_browser
        ;;
    php)
        serve_with_php && open_browser
        ;;
    docker)
        serve_with_docker && open_browser
        ;;
    auto)
        auto_detect
        ;;
    interactive)
        show_options
        ;;
    *)
        echo "❌ Unknown server type: ${2}"
        echo ""
        echo "Usage: $0 [port] [server_type]"
        echo ""
        echo "Server types:"
        echo "  auto        - Auto-detect best option (default)"
        echo "  python      - Use Python HTTP server"
        echo "  node        - Use Node.js http-server"
        echo "  php         - Use PHP built-in server"
        echo "  docker      - Use Docker with Nginx"
        echo "  interactive - Show interactive menu"
        echo ""
        echo "Examples:"
        echo "  $0                    # Auto-detect, port 8080"
        echo "  $0 3000               # Auto-detect, port 3000"
        echo "  $0 8080 python        # Python server, port 8080"
        echo "  $0 3000 interactive   # Interactive menu, port 3000"
        exit 1
        ;;
esac