# ContratoRápido - Coolify Deployment Guide

Este guia configura o ContratoRápido no Coolify (Hetzner VPS) com SSL automático e proxy reverso integrado.

## ✅ **Compatibilidade Confirmada**

- ✅ **Coolify 4.x** (2024) - Suporte nativo para Docker Compose
- ✅ **Hetzner VPS** - Integração oficial documentada
- ✅ **SSL Automático** - Let's Encrypt integrado
- ✅ **n8n Deployment** - Template oficial disponível
- ✅ **Proxy Reverso** - Traefik automático (sem nginx manual)

## 🚀 **Setup no Coolify**

### **1. Preparar Servidor Hetzner**

```bash
# Criar VPS Hetzner (mínimo CPX21: 2 vCPU, 4GB RAM)
# Ubuntu 22.04 LTS recomendado

# Instalar Coolify via SSH
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Acesse: http://SEU_IP:8000
# Crie conta admin IMEDIATAMENTE (segurança)
```

### **2. Configurar Projeto no Coolify**

1. **Novo Projeto**: "ContratoRápido"
2. **Adicionar Resource** → **Docker Compose**
3. **Git Repository**: Cole URL do seu repo
4. **Docker Compose File**: `coolify/docker-compose.coolify.yml`

### **3. Configurar Variáveis de Ambiente**

No Coolify, vá em **Environment Variables** e adicione:

```bash
# Credenciais Seguras
REDIS_PASSWORD=sua_senha_redis_forte
MONGO_ROOT_PASSWORD=sua_senha_mongo_forte
N8N_BASIC_AUTH_PASSWORD=sua_senha_n8n_forte
N8N_ENCRYPTION_KEY=sua_chave_32_caracteres_aqui

# WhatsApp Business API (após configurar Meta)
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=seu_verify_token
WHATSAPP_WEBHOOK_SECRET=seu_webhook_secret

# OpenAI
OPENAI_API_KEY=sua_chave_openai
```

### **4. Configurar Domínios (FQDNs)**

No Coolify, para cada serviço:

#### **Website Service**
- **FQDN**: `contratorapido.app.br`
- **SSL**: Automático via Let's Encrypt
- **Port**: 80 (interno)

#### **n8n Service** 
- **FQDN**: `admin.contratorapido.app.br`
- **SSL**: Automático via Let's Encrypt
- **Port**: 5678 (interno)

### **5. Configurar DNS**

Aponte seus domínios para o IP da VPS Hetzner:

```bash
# Registrar no seu provedor DNS:
contratorapido.app.br      A     SEU_IP_HETZNER
admin.contratorapido.app.br A     SEU_IP_HETZNER
```

## 📁 **Estrutura de Arquivos para Coolify**

```
criador_contrato/
├── coolify/
│   ├── docker-compose.coolify.yml  # Docker Compose otimizado
│   ├── nginx-website.conf          # Config nginx para website
│   ├── .env.coolify                # Variáveis de ambiente
│   └── COOLIFY-SETUP.md             # Este guia
├── website/                         # Site estático
├── n8n/workflows/                   # Workflows n8n
└── pdf-templates/                   # Templates PDF
```

## 🔧 **Diferenças do Setup Manual**

### **Coolify Gerencia Automaticamente:**
- ✅ **SSL/TLS** - Let's Encrypt automático
- ✅ **Proxy Reverso** - Traefik integrado
- ✅ **Load Balancing** - Entre workers n8n
- ✅ **Health Checks** - Monitoramento de containers
- ✅ **Rolling Updates** - Deploy sem downtime
- ✅ **Logs Centralizados** - Interface web
- ✅ **Backup Automático** - Volumes persistentes

### **Você Não Precisa Mais:**
- ❌ Nginx manual
- ❌ Configuração SSL manual
- ❌ Docker Compose manual
- ❌ Monitoramento manual
- ❌ Backup scripts

## 📊 **Recursos Hetzner Recomendados**

| VPS | CPU | RAM | Storage | Uso |
|-----|-----|-----|---------|-----|
| CPX21 | 2 vCPU | 4GB | 80GB | Desenvolvimento |
| CPX31 | 4 vCPU | 8GB | 160GB | Produção Small |
| CPX41 | 8 vCPU | 16GB | 240GB | Produção Medium |

## 🔍 **Verificação de Deploy**

Após deploy no Coolify:

1. **Website**: https://contratorapido.app.br
2. **Admin n8n**: https://admin.contratorapido.app.br
3. **Health Check**: https://contratorapido.app.br/health
4. **SSL Check**: Certificados válidos automaticamente

## 🐛 **Troubleshooting Coolify**

### **502 Bad Gateway**
```bash
# No Coolify logs, verificar:
# 1. Containers rodando
# 2. Health checks passando  
# 3. Variáveis de ambiente configuradas
```

### **Alto CPU (200%)**
```bash
# Adicionar swap na VPS Hetzner:
sudo fallocate -l 6G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### **Logs e Debug**
- **Coolify Interface**: Logs em tempo real por container
- **SSH na VPS**: `docker logs container_name`
- **Recursos**: Monitoramento built-in no Coolify

## 🔄 **Deploy e Atualizações**

### **Deploy Inicial**
1. Push código para Git
2. Coolify detecta mudanças automaticamente
3. Build e deploy automático
4. SSL configurado automaticamente

### **Atualizações**
1. Push para branch configurado
2. Coolify rebuilda automaticamente
3. Rolling update sem downtime
4. Rollback fácil via interface

## 💰 **Custos Estimados**

- **Hetzner CPX31** (4vCPU/8GB): €8.21/mês
- **Domínios**: ~€10/ano
- **OpenAI API**: Conforme uso
- **Coolify**: Gratuito (self-hosted)

**Total**: ~€10-15/mês (muito menor que serviços gerenciados)

## 🎯 **Vantagens vs Setup Manual**

| Recurso | Manual | Coolify |
|---------|--------|---------|
| **Tempo Setup** | ~4 horas | ~30 min |
| **SSL/TLS** | Manual | Automático |
| **Monitoring** | Configurar | Built-in |
| **Rollback** | Complexo | 1 click |
| **Logs** | SSH/Docker | Interface web |
| **Scaling** | Manual | Interface |
| **Backup** | Scripts | Automático |
| **Updates** | Manual | CI/CD |

## 🚀 **Pronto para Deploy!**

O ContratoRápido está **100% compatível** com Coolify + Hetzner. A configuração é muito mais simples que setup manual e inclui todos os recursos enterprise automaticamente.

**Next Step**: Configure as variáveis de ambiente no Coolify e faça deploy! 🎉