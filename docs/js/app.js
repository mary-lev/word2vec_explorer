class SemanticPoetryExplorer {
    constructor() {
        this.wordData = null;
        this.searchIndex = null;
        this.tsneData = null;
        this.currentWord = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Load data
            await this.loadData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Analyze default word
            this.analyzeWord('поэзия');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Ошибка загрузки данных. Попробуйте обновить страницу.');
        }
    }
    
    async loadData() {
        console.log('Loading data...');
        
        try {
            // Load word data
            const wordDataResponse = await fetch('data/word_data.json');
            if (!wordDataResponse.ok) throw new Error('Failed to load word data');
            this.wordData = await wordDataResponse.json();
            
            // Load search index
            const searchResponse = await fetch('data/search_index.json');
            if (!searchResponse.ok) throw new Error('Failed to load search index');
            this.searchIndex = await searchResponse.json();
            
            // Load t-SNE data (optional)
            try {
                const tsneResponse = await fetch('data/tsne_coords.json');
                if (tsneResponse.ok) {
                    this.tsneData = await tsneResponse.json();
                }
            } catch (e) {
                console.warn('t-SNE data not available, will use fallback visualization');
            }
            
            console.log(`Loaded data for ${Object.keys(this.wordData).length} words`);
            
        } catch (error) {
            // Fallback to demo data if files not found
            console.warn('Could not load data files, using demo data');
            this.loadDemoData();
        }
    }
    
    loadDemoData() {
        // Demo data for testing without actual model files
        this.wordData = {
            'поэзия': {
                'cosine_similarity': 0.75,
                'neighbor_overlap': 0.4,
                'shift_type': 'Context Shift',
                'shift_class': 'warning',
                'canonical_neighbors': [
                    ['стих', 0.8], ['поэт', 0.75], ['лира', 0.7], ['муза', 0.68], ['песнь', 0.65]
                ],
                'naive_neighbors': [
                    ['творчество', 0.78], ['стихотворение', 0.72], ['поэт', 0.7], ['искусство', 0.68], ['рифма', 0.65]
                ]
            },
            'любовь': {
                'cosine_similarity': 0.85,
                'neighbor_overlap': 0.6,
                'shift_type': 'Stable',
                'shift_class': 'success',
                'canonical_neighbors': [
                    ['страсть', 0.82], ['сердце', 0.78], ['душа', 0.75], ['чувство', 0.72], ['нежность', 0.7]
                ],
                'naive_neighbors': [
                    ['чувство', 0.8], ['сердце', 0.76], ['страсть', 0.74], ['отношения', 0.72], ['душа', 0.7]
                ]
            },
            'душа': {
                'cosine_similarity': 0.9,
                'neighbor_overlap': 0.8,
                'shift_type': 'Stable',
                'shift_class': 'success',
                'canonical_neighbors': [
                    ['сердце', 0.85], ['дух', 0.82], ['любовь', 0.8], ['чувство', 0.78], ['мысль', 0.75]
                ],
                'naive_neighbors': [
                    ['сердце', 0.83], ['чувство', 0.81], ['любовь', 0.79], ['дух', 0.77], ['настроение', 0.74]
                ]
            }
        };
        
        this.searchIndex = {
            'words': Object.keys(this.wordData),
            'suggestions': {
                'п': ['поэзия'],
                'по': ['поэзия'],
                'поэ': ['поэзия'],
                'л': ['любовь'],
                'лю': ['любовь'],
                'люб': ['любовь'],
                'д': ['душа'],
                'ду': ['душа'],
                'душ': ['душа']
            }
        };
    }
    
    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const suggestions = document.querySelectorAll('.word-suggestion');
        
        // Analyze button click
        analyzeBtn.addEventListener('click', () => {
            const word = wordInput.value.trim();
            if (word) {
                this.analyzeWord(word);
            }
        });
        
        // Enter key in input
        wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const word = wordInput.value.trim();
                if (word) {
                    this.analyzeWord(word);
                }
            }
        });
        
        // Word suggestions
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
        
        // Autocomplete (basic implementation)
        wordInput.addEventListener('input', (e) => {
            this.showAutocomplete(e.target.value);
        });
    }
    
    showAutocomplete(input) {
        // Simple autocomplete - could be enhanced with a dropdown
        if (!this.searchIndex || input.length < 2) return;
        
        const prefix = input.toLowerCase();
        const suggestions = this.searchIndex.suggestions[prefix] || [];
        
        // Update placeholder with first suggestion
        if (suggestions.length > 0) {
            const inputField = document.getElementById('wordInput');
            // Could implement a proper dropdown here
        }
    }
    
    analyzeWord(word) {
        this.currentWord = word.toLowerCase();
        
        // Show loading
        this.showLoading(true);
        
        // Hide previous results
        document.getElementById('resultsContainer').style.display = 'none';
        
        // Simulate processing time for demo
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
        
        // Display neighbors
        this.displayNeighbors(data.canonical_neighbors, 'canonicalNeighbors', 'Каноническая поэзия');
        this.displayNeighbors(data.naive_neighbors, 'naiveNeighbors', 'Наивная поэзия');
        
        // Create visualization
        this.createVisualization(word, data);
        
        // Show results
        document.getElementById('resultsContainer').style.display = 'block';
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
    
    createVisualization(word, data) {
        const container = document.getElementById('tsneVisualization');
        
        if (this.tsneData && this.tsneData[word.toLowerCase()]) {
            this.createTSNEPlot(word, data, container);
        } else {
            this.createNetworkVisualization(word, data, container);
        }
    }
    
    createTSNEPlot(word, data, container) {
        // Create t-SNE plot using Plotly
        const wordCoords = this.tsneData[word.toLowerCase()];
        
        const canonicalTrace = {
            x: [wordCoords.canonical.x],
            y: [wordCoords.canonical.y],
            mode: 'markers+text',
            text: [word],
            textposition: 'middle center',
            marker: { size: 15, color: 'green', symbol: 'circle' },
            name: 'Каноническая поэзия',
            type: 'scatter'
        };
        
        const naiveTrace = {
            x: [wordCoords.naive.x],
            y: [wordCoords.naive.y],
            mode: 'markers+text',
            text: [word],
            textposition: 'middle center',
            marker: { size: 15, color: 'red', symbol: 'diamond' },
            name: 'Наивная поэзия',
            type: 'scatter'
        };
        
        const layout = {
            title: `t-SNE визуализация слова "${word}"`,
            xaxis: { title: 't-SNE 1' },
            yaxis: { title: 't-SNE 2' },
            hovermode: 'closest',
            showlegend: true
        };
        
        Plotly.newPlot(container, [canonicalTrace, naiveTrace], layout);
    }
    
    createNetworkVisualization(word, data, container) {
        // Fallback: Create a network-like visualization
        container.innerHTML = `
            <div class="text-center p-4">
                <h5>Семантические соседи слова "${word}"</h5>
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-success text-white">
                                <strong>Каноническая поэзия</strong>
                            </div>
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <span class="badge bg-success fs-6">${word}</span>
                                </div>
                                <div class="d-flex flex-wrap justify-content-center gap-2">
                                    ${data.canonical_neighbors.slice(0, 10).map(([neighbor, sim]) => 
                                        `<span class="badge bg-light text-dark" style="cursor: pointer;" onclick="app.analyzeWord('${neighbor}')">
                                            ${neighbor} (${sim.toFixed(2)})
                                        </span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-danger text-white">
                                <strong>Наивная поэзия</strong>
                            </div>
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <span class="badge bg-danger fs-6">${word}</span>
                                </div>
                                <div class="d-flex flex-wrap justify-content-center gap-2">
                                    ${data.naive_neighbors.slice(0, 10).map(([neighbor, sim]) => 
                                        `<span class="badge bg-light text-dark" style="cursor: pointer;" onclick="app.analyzeWord('${neighbor}')">
                                            ${neighbor} (${sim.toFixed(2)})
                                        </span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <small class="text-muted">
                        Клицкните на любое слово для дальнейшего анализа
                    </small>
                </div>
            </div>
        `;
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

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new SemanticPoetryExplorer();
});

// Make analyzeWord available globally for onclick handlers
window.analyzeWord = function(word) {
    if (app) {
        document.getElementById('wordInput').value = word;
        app.analyzeWord(word);
    }
};