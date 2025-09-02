class EnhancedSemanticVisualization {
    constructor() {
        this.wordData = null;
        this.searchIndex = null;
        this.tsneData = null;
        this.currentWord = null;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.analyzeWord('поэзия');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Ошибка загрузки данных. Попробуйте обновить страницу.');
        }
    }
    
    async loadData() {
        console.log('Loading data...');
        
        try {
            const wordDataResponse = await fetch('data/word_data.json');
            if (!wordDataResponse.ok) throw new Error('Failed to load word data');
            this.wordData = await wordDataResponse.json();
            
            const searchResponse = await fetch('data/search_index.json');
            if (!searchResponse.ok) throw new Error('Failed to load search index');
            this.searchIndex = await searchResponse.json();
            
            try {
                const tsneResponse = await fetch('data/tsne_coords.json');
                if (tsneResponse.ok) {
                    this.tsneData = await tsneResponse.json();
                }
            } catch (e) {
                console.warn('t-SNE data not available, will compute on demand');
            }
            
            console.log(`Loaded data for ${Object.keys(this.wordData).length} words`);
            
        } catch (error) {
            console.warn('Could not load data files, using demo data');
            await this.loadDemoData();
        }
    }
    
    async loadDemoData() {
        try {
            const demoResponse = await fetch('data/demo_word_data.json');
            if (demoResponse.ok) {
                this.wordData = await demoResponse.json();
                console.log('Loaded demo data from file');
            } else {
                throw new Error('Demo file not found');
            }
        } catch (e) {
            // Fallback to hardcoded data
            console.log('Using hardcoded demo data');
            this.wordData = {
                'поэзия': {
                    'cosine_similarity': 0.75,
                    'neighbor_overlap': 0.4,
                    'shift_type': 'Context Shift',
                    'shift_class': 'warning',
                    'canonical_neighbors': [
                        ['искусство', 0.494], ['толстой', 0.482], ['верлен', 0.467], 
                        ['сложность', 0.462], ['н', 0.454], ['поэт', 0.440],
                        ['стих', 0.435], ['современный', 0.432], ['русский', 0.428]
                    ],
                    'naive_neighbors': [
                        ['поэтический', 0.754], ['искусство', 0.692], ['современный', 0.671], 
                        ['литературный', 0.657], ['творчество', 0.653], ['стихотворный', 0.648],
                        ['автор', 0.643], ['проза', 0.638], ['поэт', 0.635]
                    ]
                }
            };
        }
        
        this.searchIndex = {
            'words': Object.keys(this.wordData),
            'suggestions': {
                'п': ['поэзия'],
                'по': ['поэзия'],
                'поэ': ['поэзия'],
                'л': ['любовь'],
                'лю': ['любовь'],
                'д': ['душа'],
                'ду': ['душа']
            }
        };
    }
    
    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const suggestions = document.querySelectorAll('.word-suggestion');
        
        analyzeBtn.addEventListener('click', () => {
            const word = wordInput.value.trim();
            if (word) {
                this.analyzeWord(word);
            }
        });
        
        wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const word = wordInput.value.trim();
                if (word) {
                    this.analyzeWord(word);
                }
            }
        });
        
        suggestions.forEach(span => {
            span.style.cursor = 'pointer';
            span.style.color = '#007bff';
            span.style.textDecoration = 'underline';
            
            span.addEventListener('click', () => {
                const word = span.getAttribute('data-word');
                wordInput.value = word;
                this.analyzeWord(word);
            });
        });
    }
    
    analyzeWord(word) {
        this.currentWord = word.toLowerCase();
        this.showLoading(true);
        document.getElementById('resultsContainer').style.display = 'none';
        
        setTimeout(() => {
            this.displayResults(word);
            this.showLoading(false);
        }, 1000);
    }
    
    displayResults(word) {
        const data = this.wordData[word.toLowerCase()];
        
        if (!data) {
            this.showError(`Слово "${word}" не найдено в нашей базе данных.`);
            return;
        }
        
        // Update word info
        document.getElementById('currentWord').textContent = word;
        document.getElementById('cosineSimilarity').textContent = data.cosine_similarity.toFixed(3);
        document.getElementById('neighborOverlap').textContent = data.neighbor_overlap.toFixed(3);
        
        const shiftTypeElement = document.getElementById('shiftType');
        shiftTypeElement.textContent = data.shift_type;
        shiftTypeElement.className = `badge bg-${data.shift_class}`;
        
        // Create the enhanced visualization
        this.createEnhancedVisualization(word, data);
        
        // Display neighbors
        this.displayNeighbors(data.canonical_neighbors, 'canonicalNeighbors', 'Каноническая поэзия');
        this.displayNeighbors(data.naive_neighbors, 'naiveNeighbors', 'Наивная поэзия');
        
        document.getElementById('resultsContainer').style.display = 'block';
    }
    
    createEnhancedVisualization(word, data) {
        const container = document.getElementById('tsneVisualization');
        
        // Check if we have pre-computed visualization data
        if (data.visualization_data) {
            // Use real data from the export script
            const visData = data.visualization_data;
            this.createExactScatterPlot(word, visData, data, container);
        } else {
            // Fallback to simulated coordinates
            const allWords = [word];
            const canonicalWords = data.canonical_neighbors.slice(0, 15).map(n => n[0]);
            const naiveWords = data.naive_neighbors.slice(0, 15).map(n => n[0]);
            
            // Add neighbors
            canonicalWords.forEach(w => {
                if (!allWords.includes(w)) allWords.push(w);
            });
            naiveWords.forEach(w => {
                if (!allWords.includes(w)) allWords.push(w);
            });
            
            const coords = this.generateMockTSNECoords(allWords, word);
            this.createScatterPlot(word, allWords, coords, canonicalWords, naiveWords, container);
        }
    }
    
    createExactScatterPlot(targetWord, visData, data, container) {
        // Clear container first
        container.innerHTML = '';
        
        // Use the exact data structure from case_studies.py
        const words = visData.words;
        const wordStatus = visData.word_status;
        const coords = visData.coords;
        
        const scatterData = [];
        const textData = [];
        
        words.forEach((word, i) => {
            const [x, y] = coords[i];
            const status = wordStatus[i];
            let marker, textProps;
            
            // Exact styling from case_studies.py
            if (status === 'target') {
                marker = { 
                    symbol: 'diamond', 
                    color: 'black', 
                    size: 20, 
                    line: { width: 2, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 18, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'bold'
                };
            } else if (status === 'both') {
                marker = { 
                    symbol: 'diamond', 
                    color: 'black', 
                    size: 12, 
                    line: { width: 1.5, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'bold'
                };
            } else if (status === 'canonical') {
                marker = { 
                    symbol: 'circle', 
                    color: 'white', 
                    size: 10, 
                    line: { width: 1.5, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'normal'
                };
            } else { // naive
                marker = { 
                    symbol: 'square', 
                    color: 'black', 
                    size: 8 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'normal',
                    underline: true
                };
            }
            
            // Add marker
            scatterData.push({
                x: [x],
                y: [y],
                mode: 'markers',
                marker: marker,
                name: status,
                showlegend: false,
                hovertemplate: `<b>${word}</b><br>Категория: ${this.getCategoryName(status)}<extra></extra>`,
                type: 'scatter'
            });
            
            // Add text label with proper formatting
            const displayText = textProps.weight === 'bold' ? `<b>${textProps.text}</b>` : 
                              textProps.underline ? `<span style="text-decoration: underline">${textProps.text}</span>` : 
                              textProps.text;
            
            textData.push({
                x: [x],
                y: [y],
                mode: 'text',
                text: [displayText],
                textfont: textProps.font,
                textposition: 'top center',
                showlegend: false,
                hoverinfo: 'skip',
                type: 'scatter'
            });
        });
        
        // Combine all traces
        const allTraces = [...scatterData, ...textData];
        
        // Layout configuration (exact match to case_studies.py)
        const layout = {
            title: {
                text: `Семантическое окружение слова "${targetWord}" в канонической и наивной поэзии`,
                font: { size: 16, family: 'Arial, sans-serif', color: 'black' }
            },
            xaxis: { 
                showticklabels: false, 
                showgrid: true, 
                gridcolor: '#e0e0e0',
                gridwidth: 1,
                zeroline: false,
                showline: false
            },
            yaxis: { 
                showticklabels: false, 
                showgrid: true, 
                gridcolor: '#e0e0e0',
                gridwidth: 1,
                zeroline: false,
                showline: false
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
            margin: { l: 50, r: 200, t: 80, b: 50 },
            annotations: this.createLegendAnnotations(),
            font: { family: 'Arial, sans-serif', color: 'black' }
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: [
                'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 
                'hoverClosestCartesian', 'hoverCompareCartesian',
                'toggleSpikelines', 'zoomIn2d', 'zoomOut2d'
            ],
            displaylogo: false
        };
        
        Plotly.newPlot(container, allTraces, layout, config);
        
        // Add similarity information below the plot
        this.addSimilarityInfo(targetWord, data, container);
    }
    
    generateMockTSNECoords(words, targetWord) {
        // Generate realistic-looking scatter coordinates
        const coords = [];
        const centerX = 0;
        const centerY = 0;
        
        words.forEach((w, i) => {
            if (w === targetWord) {
                // Target word at center
                coords.push([centerX, centerY]);
            } else {
                // Other words in a loose circle around center
                const angle = (i / words.length) * 2 * Math.PI;
                const radius = 2 + Math.random() * 3;
                const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5);
                const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5);
                coords.push([x, y]);
            }
        });
        
        return coords;
    }
    
    createScatterPlot(targetWord, allWords, coords, canonicalWords, naiveWords, container) {
        // Clear container first
        container.innerHTML = '';
        
        // Create the plot data exactly matching the case_studies.py visualization
        const scatterData = [];
        const textData = [];
        
        allWords.forEach((word, i) => {
            const [x, y] = coords[i];
            let category, marker, textProps;
            
            // Determine category and styling (exact match to case_studies.py)
            if (word === targetWord) {
                category = 'target';
                marker = { 
                    symbol: 'diamond', 
                    color: 'black', 
                    size: 20, 
                    line: { width: 2, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 18, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'bold'
                };
            } else if (canonicalWords.includes(word) && naiveWords.includes(word)) {
                category = 'both';
                marker = { 
                    symbol: 'diamond', 
                    color: 'black', 
                    size: 12, 
                    line: { width: 1.5, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'bold'
                };
            } else if (canonicalWords.includes(word)) {
                category = 'canonical';
                marker = { 
                    symbol: 'circle', 
                    color: 'white', 
                    size: 10, 
                    line: { width: 1.5, color: 'black' } 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'normal'
                };
            } else { // naive
                category = 'naive';
                marker = { 
                    symbol: 'square', 
                    color: 'black', 
                    size: 8 
                };
                textProps = {
                    text: word,
                    font: { size: 14, family: 'Arial, sans-serif', color: 'black' },
                    weight: 'normal',
                    underline: true
                };
            }
            
            // Add marker
            scatterData.push({
                x: [x],
                y: [y],
                mode: 'markers',
                marker: marker,
                name: category,
                showlegend: false,
                hovertemplate: `<b>${word}</b><br>Категория: ${this.getCategoryName(category)}<extra></extra>`,
                type: 'scatter'
            });
            
            // Add text label
            textData.push({
                x: [x],
                y: [y],
                mode: 'text',
                text: [textProps.underline ? `<span style="text-decoration: underline">${textProps.text}</span>` : textProps.text],
                textfont: textProps.font,
                textposition: 'top center',
                showlegend: false,
                hoverinfo: 'skip',
                type: 'scatter'
            });
        });
        
        // Combine all traces
        const allTraces = [...scatterData, ...textData];
        
        // Layout configuration (matching case_studies.py exactly)
        const layout = {
            title: {
                text: `Семантическое окружение слова "${targetWord}" в канонической и наивной поэзии`,
                font: { size: 16, family: 'Arial, sans-serif', color: 'black' }
            },
            xaxis: { 
                showticklabels: false, 
                showgrid: true, 
                gridcolor: '#e0e0e0',
                gridwidth: 1,
                zeroline: false,
                showline: false
            },
            yaxis: { 
                showticklabels: false, 
                showgrid: true, 
                gridcolor: '#e0e0e0',
                gridwidth: 1,
                zeroline: false,
                showline: false
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
            margin: { l: 50, r: 200, t: 80, b: 50 },
            annotations: this.createLegendAnnotations(),
            font: { family: 'Arial, sans-serif', color: 'black' }
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: [
                'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 
                'hoverClosestCartesian', 'hoverCompareCartesian',
                'toggleSpikelines', 'zoomIn2d', 'zoomOut2d'
            ],
            displaylogo: false
        };
        
        Plotly.newPlot(container, allTraces, layout, config);
        
        // Add similarity information below the plot
        this.addSimilarityInfo(targetWord, data, container);
    }
    
    getCategoryName(category) {
        const names = {
            'target': 'Целевое слово',
            'both': 'В обоих корпусах',
            'canonical': 'Только каноническая поэзия',
            'naive': 'Только наивная поэзия'
        };
        return names[category] || 'Неизвестно';
    }
    
    createLegendAnnotations() {
        return [
            {
                x: 1.02,
                y: 1,
                xref: 'paper',
                yref: 'paper',
                text: '◯ Только в канонической поэзии (обычный шрифт)<br>' +
                      '■ Только в наивной поэзии (подчёркнутый шрифт)<br>' +
                      '◆ В обоих корпусах (жирный шрифт)',
                showarrow: false,
                align: 'left',
                bgcolor: 'white',
                bordercolor: 'black',
                borderwidth: 1,
                font: { size: 12, family: 'Arial, sans-serif', color: 'black' }
            }
        ];
    }
    
    addSimilarityInfo(targetWord, data, container) {
        // Create info box below the plot
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mt-3 p-3 border rounded bg-light';
        infoDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><strong>Топ-5 в канонической поэзии:</strong></h6>
                    <small>
                        ${data.canonical_neighbors.slice(0, 5).map(([word, sim]) => 
                            `<span class="badge bg-secondary me-1">${word}: ${sim.toFixed(3)}</span>`
                        ).join('')}
                    </small>
                </div>
                <div class="col-md-6">
                    <h6><strong>Топ-5 в наивной поэзии:</strong></h6>
                    <small>
                        ${data.naive_neighbors.slice(0, 5).map(([word, sim]) => 
                            `<span class="badge bg-dark me-1">${word}: ${sim.toFixed(3)}</span>`
                        ).join('')}
                    </small>
                </div>
            </div>
        `;
        
        container.appendChild(infoDiv);
    }
    
    displayNeighbors(neighbors, containerId, title) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const list = document.createElement('ol');
        list.className = 'list-group list-group-numbered';
        
        neighbors.forEach(([neighbor, similarity]) => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const wordSpan = document.createElement('span');
            wordSpan.textContent = neighbor;
            wordSpan.style.cursor = 'pointer';
            wordSpan.style.color = '#007bff';
            wordSpan.addEventListener('click', () => {
                document.getElementById('wordInput').value = neighbor;
                this.analyzeWord(neighbor);
            });
            
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary rounded-pill';
            badge.textContent = similarity.toFixed(3);
            
            item.appendChild(wordSpan);
            item.appendChild(badge);
            list.appendChild(item);
        });
        
        container.appendChild(list);
    }
    
    showLoading(show) {
        const loading = document.getElementById('loadingIndicator');
        loading.style.display = show ? 'block' : 'none';
    }
    
    showError(message) {
        this.showLoading(false);
        const container = document.getElementById('tsneVisualization');
        container.innerHTML = `
            <div class="alert alert-warning text-center" role="alert">
                <h4 class="alert-heading">Внимание</h4>
                <p>${message}</p>
                <hr>
                <p class="mb-0">Попробуйте другое слово из предложенного списка.</p>
            </div>
        `;
        document.getElementById('resultsContainer').style.display = 'block';
    }
}

// Initialize the enhanced application
let enhancedApp;
document.addEventListener('DOMContentLoaded', function() {
    enhancedApp = new EnhancedSemanticVisualization();
});

// Make analyzeWord available globally
window.analyzeWord = function(word) {
    if (enhancedApp) {
        document.getElementById('wordInput').value = word;
        enhancedApp.analyzeWord(word);
    }
};