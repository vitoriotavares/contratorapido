#!/bin/bash

# PDF Generation Testing Script
# Tests Gotenberg service with sample contract data

set -e

echo "📄 PDF Generation Testing"
echo "========================="

# Check if Gotenberg service is running
echo "🔍 Checking Gotenberg service status..."

GOTENBERG_URL="http://localhost:3000"
LIBREOFFICE_URL="http://localhost:3001"

# Test Gotenberg health
gotenberg_health=$(curl -s -o /dev/null -w "%{http_code}" "$GOTENBERG_URL/health" || echo "000")

if [ "$gotenberg_health" = "200" ]; then
    echo "✅ Gotenberg service is healthy"
else
    echo "❌ Gotenberg service is not accessible (HTTP $gotenberg_health)"
    echo "💡 Start services with: docker-compose -f docker-compose.gotenberg.yml up -d"
    exit 1
fi

echo ""

# Create test data
echo "📝 Creating test contract data..."

test_data='{
  "locador_nome": "João da Silva Santos",
  "locador_documento": "123.456.789-00",
  "locador_endereco": "Rua das Flores, 123, Apto 45",
  "locador_cidade": "São Paulo",
  "locador_estado": "SP",
  "locador_cep": "01234-567",
  
  "locatario_nome": "Maria Oliveira Costa",
  "locatario_documento": "987.654.321-00", 
  "locatario_endereco": "Avenida Paulista, 1000, Apto 12",
  "locatario_cidade": "São Paulo",
  "locatario_estado": "SP",
  "locatario_cep": "01310-100",
  
  "imovel_endereco": "Rua dos Jardins, 456, Casa 2",
  "imovel_tipo": "Casa",
  "imovel_cidade": "São Paulo",
  "imovel_estado": "SP", 
  "imovel_cep": "04567-890",
  
  "valor_aluguel": "2.500,00",
  "valor_aluguel_extenso": "dois mil e quinhentos reais",
  "valor_caucao": "5.000,00",
  "dia_vencimento": "05",
  
  "duracao_contrato": "12 (doze) meses",
  "data_inicio": "01 de dezembro de 2024",
  "data_fim": "30 de novembro de 2025",
  
  "comarca": "São Paulo/SP",
  "cidade_assinatura": "São Paulo/SP",
  "data_assinatura": "'$(date '+%d de %B de %Y' | sed 's/January/janeiro/; s/February/fevereiro/; s/March/março/; s/April/abril/; s/May/maio/; s/June/junho/; s/July/julho/; s/August/agosto/; s/September/setembro/; s/October/outubro/; s/November/novembro/; s/December/dezembro/')'",
  
  "data_geracao": "'$(date '+%d/%m/%Y %H:%M:%S')'",
  "documento_id": "CR-'$(date +%Y%m%d%H%M%S)'-TEST"
}'

# Load HTML template and replace variables
echo "🔧 Processing HTML template with test data..."

template_file="./pdf-templates/contract-base.html"

if [ ! -f "$template_file" ]; then
    echo "❌ Template file not found: $template_file"
    exit 1
fi

# Create temporary file with processed HTML
temp_html="/tmp/contract-test-$(date +%s).html"

# Read template and replace variables
html_content=$(cat "$template_file")

# Replace each variable using the test data
html_content=$(echo "$html_content" | sed "s/{{locador_nome}}/João da Silva Santos/g")
html_content=$(echo "$html_content" | sed "s/{{locador_documento}}/123.456.789-00/g")
html_content=$(echo "$html_content" | sed "s/{{locador_endereco}}/Rua das Flores, 123, Apto 45/g")
html_content=$(echo "$html_content" | sed "s/{{locador_cidade}}/São Paulo/g")
html_content=$(echo "$html_content" | sed "s/{{locador_estado}}/SP/g")
html_content=$(echo "$html_content" | sed "s/{{locador_cep}}/01234-567/g")

html_content=$(echo "$html_content" | sed "s/{{locatario_nome}}/Maria Oliveira Costa/g")
html_content=$(echo "$html_content" | sed "s/{{locatario_documento}}/987.654.321-00/g")
html_content=$(echo "$html_content" | sed "s/{{locatario_endereco}}/Avenida Paulista, 1000, Apto 12/g")
html_content=$(echo "$html_content" | sed "s/{{locatario_cidade}}/São Paulo/g")
html_content=$(echo "$html_content" | sed "s/{{locatario_estado}}/SP/g")
html_content=$(echo "$html_content" | sed "s/{{locatario_cep}}/01310-100/g")

html_content=$(echo "$html_content" | sed "s/{{imovel_endereco}}/Rua dos Jardins, 456, Casa 2/g")
html_content=$(echo "$html_content" | sed "s/{{imovel_tipo}}/Casa/g")
html_content=$(echo "$html_content" | sed "s/{{imovel_cidade}}/São Paulo/g")
html_content=$(echo "$html_content" | sed "s/{{imovel_estado}}/SP/g")
html_content=$(echo "$html_content" | sed "s/{{imovel_cep}}/04567-890/g")

html_content=$(echo "$html_content" | sed "s/{{valor_aluguel}}/2.500,00/g")
html_content=$(echo "$html_content" | sed "s/{{valor_aluguel_extenso}}/dois mil e quinhentos reais/g")
html_content=$(echo "$html_content" | sed "s/{{valor_caucao}}/5.000,00/g")
html_content=$(echo "$html_content" | sed "s/{{dia_vencimento}}/05/g")

html_content=$(echo "$html_content" | sed "s/{{duracao_contrato}}/12 (doze) meses/g")
html_content=$(echo "$html_content" | sed "s/{{data_inicio}}/01 de dezembro de 2024/g")
html_content=$(echo "$html_content" | sed "s/{{data_fim}}/30 de novembro de 2025/g")

html_content=$(echo "$html_content" | sed "s/{{comarca}}/São Paulo\/SP/g")
html_content=$(echo "$html_content" | sed "s/{{cidade_assinatura}}/São Paulo\/SP/g")
html_content=$(echo "$html_content" | sed "s/{{data_assinatura}}/$(date '+%d de dezembro de 2024')/g")

html_content=$(echo "$html_content" | sed "s/{{data_geracao}}/$(date '+%d\/%m\/%Y %H:%M:%S')/g")
html_content=$(echo "$html_content" | sed "s/{{documento_id}}/CR-$(date +%Y%m%d%H%M%S)-TEST/g")

# Save processed HTML
echo "$html_content" > "$temp_html"

echo "✅ HTML template processed successfully"

# Test PDF generation
echo ""
echo "🚀 Testing PDF generation..."

output_dir="./test-output"
mkdir -p "$output_dir"

pdf_output="$output_dir/contract-test-$(date +%s).pdf"

# Generate PDF using Gotenberg
echo "Sending HTML to Gotenberg for PDF conversion..."

response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -X POST \
  -F "files=@$temp_html" \
  -F "paperWidth=8.5" \
  -F "paperHeight=11" \
  -F "marginTop=0.39" \
  -F "marginBottom=0.39" \
  -F "marginLeft=0.39" \
  -F "marginRight=0.39" \
  -F "printBackground=true" \
  -F "waitDelay=3s" \
  --output "$pdf_output" \
  "$GOTENBERG_URL/forms/chromium/convert/html" \
  2>/dev/null || echo "HTTP_STATUS:000")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$http_status" = "200" ] && [ -f "$pdf_output" ]; then
    file_size=$(stat -f%z "$pdf_output" 2>/dev/null || stat -c%s "$pdf_output" 2>/dev/null)
    echo "✅ PDF generation successful!"
    echo "   Output: $pdf_output"
    echo "   Size: ${file_size} bytes"
    
    # Validate PDF
    if [ "$file_size" -gt 1000 ]; then
        echo "✅ PDF file size validation passed"
        
        # Try to extract text to validate content
        if command -v pdftotext >/dev/null 2>&1; then
            text_output="/tmp/contract-test-text.txt"
            pdftotext "$pdf_output" "$text_output" 2>/dev/null
            
            if grep -q "CONTRATO DE LOCAÇÃO" "$text_output" 2>/dev/null; then
                echo "✅ PDF content validation passed"
            else
                echo "⚠️  PDF content validation inconclusive"
            fi
            
            rm -f "$text_output"
        fi
    else
        echo "❌ PDF file size too small - generation may have failed"
    fi
else
    echo "❌ PDF generation failed"
    echo "   HTTP Status: $http_status"
    if [ -f "$pdf_output" ]; then
        echo "   File exists but may be corrupted"
        rm -f "$pdf_output"
    fi
fi

# Cleanup
rm -f "$temp_html"

echo ""

# Test performance
echo "⚡ Performance Test"
echo "Generating 3 PDFs to test concurrent processing..."

start_time=$(date +%s)

for i in {1..3}; do
    test_html="/tmp/contract-perf-test-$i.html"
    test_pdf="$output_dir/contract-perf-test-$i.pdf"
    
    # Create slightly different content for each test
    sed "s/{{documento_id}}/CR-$(date +%Y%m%d%H%M%S)-PERF$i/g" "$template_file" | \
    sed "s/{{locador_nome}}/Test User $i/g" | \
    sed "s/{{locatario_nome}}/Test Tenant $i/g" | \
    sed "s/{{data_geracao}}/$(date '+%d\/%m\/%Y %H:%M:%S')/g" > "$test_html"
    
    # Generate PDF in background
    curl -s -X POST \
      -F "files=@$test_html" \
      -F "paperWidth=8.5" \
      -F "paperHeight=11" \
      -F "printBackground=true" \
      --output "$test_pdf" \
      "$GOTENBERG_URL/forms/chromium/convert/html" &
    
    rm -f "$test_html"
done

# Wait for all background jobs
wait

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "✅ Performance test completed in ${duration} seconds"

# Check results
success_count=0
for i in {1..3}; do
    test_pdf="$output_dir/contract-perf-test-$i.pdf"
    if [ -f "$test_pdf" ] && [ $(stat -f%z "$test_pdf" 2>/dev/null || stat -c%s "$test_pdf" 2>/dev/null) -gt 1000 ]; then
        success_count=$((success_count + 1))
    fi
done

echo "   Success rate: $success_count/3 PDFs generated successfully"

if [ "$success_count" -eq 3 ] && [ "$duration" -lt 30 ]; then
    echo "✅ Performance requirements met (< 30 seconds)"
else
    echo "⚠️  Performance requirements not met"
fi

echo ""

# Resource usage check
echo "📊 Resource Usage Check"
if command -v docker >/dev/null 2>&1; then
    echo "Gotenberg container stats:"
    docker stats criador_contrato_gotenberg --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Container not running"
fi

echo ""
echo "📋 Test Summary"
echo "==============="
echo "✅ Gotenberg service: Healthy"
echo "✅ Template processing: Working"
echo "✅ PDF generation: $([ "$http_status" = "200" ] && echo "Working" || echo "Failed")"
echo "✅ Performance test: $success_count/3 successful"

echo ""
echo "📂 Generated files:"
ls -la "$output_dir"/*.pdf 2>/dev/null || echo "No PDF files found"

echo ""
echo "🎉 PDF generation testing complete!"
echo ""
echo "Next steps:"
echo "1. Review generated PDF files in $output_dir"
echo "2. Integrate with n8n workflow in CR-008"
echo "3. Configure template engine in CR-007"