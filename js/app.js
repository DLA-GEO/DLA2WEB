// Variáveis globais para o aplicativo
let empreendimentos = [];
let markers = [];
let map; // Variável global para o mapa

// Inicializar o aplicativo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando aplicativo...');
    
    // Inicializar funcionalidades do aplicativo de licenciamento
    initializeLicensingApp();
    
    // Ajustar o mapa quando a janela for redimensionada
    window.addEventListener('resize', function() {
        if (map) {
            setTimeout(function() {
                map.invalidateSize();
            }, 100);
        }
    });
});

// FUNÇÕES DO APLICATIVO DE LICENCIAMENTO
function initializeLicensingApp() {
    console.log('Inicializando aplicativo de licenciamento...');
    
    // Funções de conversão de coordenadas
    function gmsToDecimal(degrees, minutes, seconds, direction) {
        const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
        return direction * decimal;
    }
    
    function decimalToGms(decimal) {
        const absDecimal = Math.abs(decimal);
        const degrees = Math.floor(absDecimal);
        const minutes = Math.floor((absDecimal - degrees) * 60);
        const seconds = ((absDecimal - degrees - minutes / 60) * 3600).toFixed(3);
        
        return {
            degrees: degrees,
            minutes: minutes,
            seconds: parseFloat(seconds),
            direction: decimal >= 0 ? 1 : -1
        };
    }
    
    // Atualizar displays decimais
    function updateDecimalDisplays() {
        const latDeg = parseFloat(document.getElementById('lat-degrees').value) || 0;
        const latMin = parseFloat(document.getElementById('lat-minutes').value) || 0;
        const latSec = parseFloat(document.getElementById('lat-seconds').value) || 0;
        const latDir = parseFloat(document.getElementById('lat-direction').value);
        
        const lonDeg = parseFloat(document.getElementById('lon-degrees').value) || 0;
        const lonMin = parseFloat(document.getElementById('lon-minutes').value) || 0;
        const lonSec = parseFloat(document.getElementById('lon-seconds').value) || 0;
        const lonDir = parseFloat(document.getElementById('lon-direction').value);
        
        const latDecimal = gmsToDecimal(latDeg, latMin, latSec, latDir);
        const lonDecimal = gmsToDecimal(lonDeg, lonMin, lonSec, lonDir);
        
        document.getElementById('lat-decimal-display').textContent = `Decimal: ${latDecimal.toFixed(6)}°`;
        document.getElementById('lon-decimal-display').textContent = `Decimal: ${lonDecimal.toFixed(6)}°`;
        
        document.getElementById('latitude-decimal').value = latDecimal.toFixed(6);
        document.getElementById('longitude-decimal').value = lonDecimal.toFixed(6);
    }
    
    // Atualizar displays GMS a partir do decimal
    function updateGmsDisplays() {
        const latDecimal = parseFloat(document.getElementById('latitude-decimal').value) || 0;
        const lonDecimal = parseFloat(document.getElementById('longitude-decimal').value) || 0;
        
        const latGms = decimalToGms(latDecimal);
        const lonGms = decimalToGms(lonDecimal);
        
        document.getElementById('lat-degrees').value = latGms.degrees;
        document.getElementById('lat-minutes').value = latGms.minutes;
        document.getElementById('lat-seconds').value = latGms.seconds.toFixed(3);
        document.getElementById('lat-direction').value = latGms.direction;
        
        document.getElementById('lon-degrees').value = lonGms.degrees;
        document.getElementById('lon-minutes').value = lonGms.minutes;
        document.getElementById('lon-seconds').value = lonGms.seconds.toFixed(3);
        document.getElementById('lon-direction').value = lonGms.direction;
        
        updateDecimalDisplays();
    }
    
    // Configuração do toggle de formato
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const format = this.getAttribute('data-format');
            
            if (format === 'gms') {
                document.getElementById('latitude-gms-group').style.display = 'block';
                document.getElementById('longitude-gms-group').style.display = 'block';
                document.getElementById('latitude-decimal-group').style.display = 'none';
                document.getElementById('longitude-decimal-group').style.display = 'none';
                updateGmsDisplays();
            } else {
                document.getElementById('latitude-gms-group').style.display = 'none';
                document.getElementById('longitude-gms-group').style.display = 'none';
                document.getElementById('latitude-decimal-group').style.display = 'block';
                document.getElementById('longitude-decimal-group').style.display = 'block';
                updateDecimalDisplays();
            }
        });
    });
    
    // Configuração do toggle de tipo de busca
    document.querySelectorAll('.search-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.search-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const searchType = this.getAttribute('data-search-type');
            
            document.querySelectorAll('.search-section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.getElementById(`${searchType}-search`).classList.add('active');
        });
    });
    
    // Event listeners para atualização automática
    document.querySelectorAll('#lat-degrees, #lat-minutes, #lat-seconds, #lat-direction, #lon-degrees, #lon-minutes, #lon-seconds, #lon-direction').forEach(input => {
        input.addEventListener('input', updateDecimalDisplays);
    });
    
    document.getElementById('latitude-decimal').addEventListener('input', updateGmsDisplays);
    document.getElementById('longitude-decimal').addEventListener('input', updateGmsDisplays);
    
    // Configuração do upload de arquivo CSV
    const fileUploadArea = document.getElementById('file-upload-area');
    const csvFileInput = document.getElementById('csv-file');
    const fileName = document.getElementById('file-name');
    
    fileUploadArea.addEventListener('click', () => {
        csvFileInput.click();
    });
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.background = '#e8f5e9';
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.background = '#f8fdf9';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.background = '#f8fdf9';
        
        if (e.dataTransfer.files.length) {
            csvFileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    function handleFileUpload(file) {
        console.log('Arquivo selecionado:', file.name);
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Por favor, selecione um arquivo CSV válido.');
            return;
        }
        
        fileName.textContent = `Arquivo: ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            parseCSVData(csvText);
        };
        reader.readAsText(file, 'UTF-8');
    }
    
    function parseCSVData(csvText) {
        console.log('Iniciando parse do CSV...');
        // Limpar marcadores anteriores
        markers.forEach(marker => {
            if (marker.marker && window.map && window.map.hasLayer(marker.marker)) {
                window.map.removeLayer(marker.marker);
            }
        });
        markers = [];
        
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            alert('O arquivo CSV está vazio.');
            return;
        }
        
        // Usar ponto e vírgula como separador
        const separator = ';';
        const headers = lines[0].split(separator).map(header => header.trim().toLowerCase());
        
        console.log('Headers detectados:', headers);
        
        empreendimentos = [];
        let linhasComErro = 0;
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            try {
                const values = lines[i].split(separator).map(value => value.trim());
                
                const empreendimento = {};
                
                headers.forEach((header, index) => {
                    empreendimento[header] = values[index] || '';
                });
                
                // Converter latitude e longitude para números
                if (empreendimento.latitude) {
                    empreendimento.latitude = parseFloat(empreendimento.latitude.toString().replace(',', '.'));
                }
                if (empreendimento.longitude) {
                    empreendimento.longitude = parseFloat(empreendimento.longitude.toString().replace(',', '.'));
                }
                
                console.log('Processando empreendimento:', empreendimento);
                
                // Só adicionar se as coordenadas são válidas
                if (!isNaN(empreendimento.latitude) && !isNaN(empreendimento.longitude)) {
                    empreendimentos.push(empreendimento);
                    
                    // Adicionar marcador ao mapa
                    const marker = L.marker([empreendimento.latitude, empreendimento.longitude])
                        .addTo(window.map)
                        .bindPopup(`
                            <strong>${empreendimento.empreendimento || 'N/A'}</strong><br>
                            Processo: ${empreendimento.processo || 'N/A'}<br>
                            Situação: ${empreendimento.situacao_processo || 'N/A'}<br>
                            Título: ${empreendimento.titulo || 'N/A'}
                        `);
                    
                    markers.push({
                        marker: marker,
                        data: empreendimento
                    });
                    
                    console.log('Marcador adicionado:', empreendimento.latitude, empreendimento.longitude);
                } else {
                    console.log('Coordenadas inválidas na linha:', i + 1, empreendimento);
                    linhasComErro++;
                }
            } catch (error) {
                console.error(`Erro na linha ${i + 1}:`, error);
                linhasComErro++;
            }
        }
        
        console.log('Total de marcadores:', markers.length);
        
        // Ajustar a visualização do mapa para mostrar todos os marcadores
        if (markers.length > 0 && window.map) {
            const group = new L.featureGroup(markers.map(m => m.marker));
            window.map.fitBounds(group.getBounds().pad(0.1));
            console.log('Mapa ajustado para mostrar marcadores');
        } else {
            console.log('Nenhum marcador válido encontrado');
        }
        
        let mensagem = `${empreendimentos.length} empreendimentos carregados`;
        if (linhasComErro > 0) {
            mensagem += ` (${linhasComErro} linhas com erro foram ignoradas)`;
        }
        
        document.getElementById('results-count').textContent = mensagem;
        
        // Preencher a tabela com todos os empreendimentos inicialmente
        updateResultsTable(empreendimentos);
    }
    
    // Função para calcular distância entre duas coordenadas (Haversine formula)
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }
    
    // Função para atualizar a tabela de resultados
    function updateResultsTable(resultados) {
        const tabela = document.getElementById('results-table');
        const contador = document.getElementById('results-count');
        
        tabela.innerHTML = '';
        contador.textContent = `${resultados.length} resultados`;
        
        if (resultados.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum empreendimento encontrado.</td></tr>';
        } else {
            resultados.forEach(emp => {
                const statusClass = 
                    (emp.situacao_processo && emp.situacao_processo.includes('Licenciado')) || 
                    (emp.situacao_tit && emp.situacao_tit.includes('Vigente')) ? 'status-active' :
                    (emp.situacao_processo && emp.situacao_processo.includes('Suspenso')) || 
                    (emp.situacao_tit && emp.situacao_tit.includes('Vencida')) ? 'status-inactive' :
                    'status-pending';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.empreendimento || 'N/A'}</td>
                    <td>${emp.processo || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${emp.situacao_processo || 'N/A'}</span></td>
                    <td>${emp.localizacao || emp.Localizacao || 'N/A'}</td>
                    <td>${emp.titulo || 'N/A'}</td>
                    <td>${emp.distancia ? emp.distancia.toFixed(2) + ' km' : 'N/A'}</td>
                `;
                
                // Adicionar evento de clique para focar no marcador
                if (emp.latitude && emp.longitude) {
                    row.style.cursor = 'pointer';
                    row.addEventListener('click', () => {
                        if (window.map) {
                            window.map.setView([emp.latitude, emp.longitude], 10);
                            const markerObj = markers.find(m => m.data === emp);
                            if (markerObj) {
                                markerObj.marker.openPopup();
                            }
                        }
                    });
                }
                
                tabela.appendChild(row);
            });
        }
    }
    
    // Função para obter coordenadas decimais atuais
    function getCurrentCoordinates() {
        const format = document.querySelector('.format-btn.active').getAttribute('data-format');
        
        if (format === 'gms') {
            const latDeg = parseFloat(document.getElementById('lat-degrees').value) || 0;
            const latMin = parseFloat(document.getElementById('lat-minutes').value) || 0;
            const latSec = parseFloat(document.getElementById('lat-seconds').value) || 0;
            const latDir = parseFloat(document.getElementById('lat-direction').value);
            
            const lonDeg = parseFloat(document.getElementById('lon-degrees').value) || 0;
            const lonMin = parseFloat(document.getElementById('lon-minutes').value) || 0;
            const lonSec = parseFloat(document.getElementById('lon-seconds').value) || 0;
            const lonDir = parseFloat(document.getElementById('lon-direction').value);
            
            return {
                latitude: gmsToDecimal(latDeg, latMin, latSec, latDir),
                longitude: gmsToDecimal(lonDeg, lonMin, lonSec, lonDir)
            };
        } else {
            return {
                latitude: parseFloat(document.getElementById('latitude-decimal').value) || 0,
                longitude: parseFloat(document.getElementById('longitude-decimal').value) || 0
            };
        }
    }
    
    // Função para buscar por coordenadas
    function buscarPorCoordenadas() {
        if (empreendimentos.length === 0) {
            alert('Por favor, carregue um arquivo CSV primeiro.');
            return;
        }
        
        if (!window.map) {
            alert('Mapa não está disponível.');
            return;
        }
        
        const coords = getCurrentCoordinates();
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        const radius = parseFloat(document.getElementById('radius').value);
        
        if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
            alert("Por favor, insira coordenadas e raio válidos.");
            return;
        }
        
        // Limpar círculo de busca anterior, se existir
        if (window.searchCircle) {
            window.map.removeLayer(window.searchCircle);
        }
        
        // Adicionar círculo de busca
        window.searchCircle = L.circle([latitude, longitude], {
            color: '#3498db',
            fillColor: '#3498db',
            fillOpacity: 0.2,
            radius: radius * 1000
        }).addTo(window.map);
        
        // Adicionar marcador para a coordenada de busca
        if (window.searchMarker) {
            window.map.removeLayer(window.searchMarker);
        }
        
        window.searchMarker = L.marker([latitude, longitude])
            .addTo(window.map)
            .bindPopup('Coordenada de Busca')
            .openPopup();
        
        // Ajustar o zoom do mapa para mostrar a área de busca
        window.map.fitBounds(window.searchCircle.getBounds());
        
        // Filtrar empreendimentos dentro do raio
        const resultados = [];
        markers.forEach(markerObj => {
            const distancia = calcularDistancia(
                latitude, longitude,
                markerObj.data.latitude, markerObj.data.longitude
            );
            
            markerObj.distancia = distancia;
            
            if (distancia <= radius) {
                resultados.push({
                    ...markerObj.data,
                    distancia: distancia
                });
                
                // Alterar a cor do marcador para verde
                markerObj.marker.setIcon(
                    L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                );
            } else {
                // Alterar a cor do marcador para vermelho
                markerObj.marker.setIcon(
                    L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                );
            }
        });
        
        // Exibir resultados na tabela
        updateResultsTable(resultados);
    }
    
    // Função para buscar por processo
    function buscarPorProcesso() {
        if (empreendimentos.length === 0) {
            alert('Por favor, carregue um arquivo CSV primeiro.');
            return;
        }
        
        const processNumber = document.getElementById('process-number').value.trim();
        
        if (!processNumber) {
            alert('Por favor, insira um número de processo.');
            return;
        }
        
        // Limpar elementos de busca anteriores
        if (window.searchCircle && window.map) {
            window.map.removeLayer(window.searchCircle);
        }
        if (window.searchMarker && window.map) {
            window.map.removeLayer(window.searchMarker);
        }
        
        // Buscar empreendimento pelo número do processo
        const resultados = [];
        let encontrado = false;
        
        markers.forEach(markerObj => {
            const processo = markerObj.data.processo || '';
            
            if (processo.toLowerCase().includes(processNumber.toLowerCase())) {
                resultados.push(markerObj.data);
                encontrado = true;
                
                // Destacar o marcador encontrado em verde
                markerObj.marker.setIcon(
                    L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                );
                
                // Centralizar o mapa no empreendimento encontrado
                if (window.map) {
                    window.map.setView([markerObj.data.latitude, markerObj.data.longitude], 10);
                    markerObj.marker.openPopup();
                }
            } else {
                // Deixar outros marcadores em vermelho
                markerObj.marker.setIcon(
                    L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                );
            }
        });
        
        if (!encontrado) {
            alert('Nenhum empreendimento encontrado com o número de processo informado.');
        }
        
        // Exibir resultados na tabela
        updateResultsTable(resultados);
    }
    
    // Função para mostrar todos os empreendimentos
    function mostrarTodos() {
        if (empreendimentos.length === 0) {
            alert('Por favor, carregue um arquivo CSV primeiro.');
            return;
        }
        
        // Limpar elementos de busca anteriores
        if (window.searchCircle && window.map) {
            window.map.removeLayer(window.searchCircle);
        }
        if (window.searchMarker && window.map) {
            window.map.removeLayer(window.searchMarker);
        }
        
        // Resetar todos os marcadores para a cor padrão
        markers.forEach(markerObj => {
            markerObj.marker.setIcon(
                L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            );
        });
        
        // Ajustar a visualização do mapa para mostrar todos os marcadores
        if (markers.length > 0 && window.map) {
            const group = new L.featureGroup(markers.map(m => m.marker));
            window.map.fitBounds(group.getBounds().pad(0.1));
        }
        
        // Exibir todos os empreendimentos na tabela
        updateResultsTable(empreendimentos);
    }
    
    // Adicionar eventos aos botões
    document.getElementById('search-coordinates-btn').addEventListener('click', buscarPorCoordenadas);
    document.getElementById('search-process-btn').addEventListener('click', buscarPorProcesso);
    document.getElementById('show-all-btn').addEventListener('click', mostrarTodos);
    
    // Inicializar displays
    updateDecimalDisplays();
    
    // Adicionar alguns empreendimentos de exemplo (caso o usuário não carregue um CSV)
    const exemploCSV = `empreendimento;processo;situacao_processo;Localizacao;nome_titulo;titulo;situacao_tit;latitude;longitude
Usina Hidrelétrica Belo Monte;2022/0000009426;Licenciado;Altamira;Licença de Operação;LO 9876;Vigente;-3.1276;-52.0217
Mineração de Bauxita;2023/0000001234;Em análise;Paragominas;Licença Prévia;LP 5432;Em análise;-3.0026;-47.3527
Projeto de Reflorestamento;2021/0000005678;Suspenso;Santarém;Licença de Instalação;LI 1234;Suspensa;-2.4431;-54.7079
Termelétrica a Gás;2022/0000009012;Licenciado;Marabá;Licença de Operação;LO 5678;Vigente;-5.3689;-49.1178
Frigorífico Bovino;2023/0000003456;Em operação;Redenção;Licença de Operação;LO 8765;Vencida;-8.0253;-50.0314`;
    
    // Parse do exemplo automaticamente
    console.log('Carregando exemplo CSV...');
    parseCSVData(exemploCSV);
    fileName.textContent = "Arquivo: exemplo_para.csv (carregado automaticamente)";
    
    console.log('Aplicativo de licenciamento inicializado com sucesso!');
}