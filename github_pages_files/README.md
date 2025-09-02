# Semantic Poetry Explorer

🔗 **Live Demo**: https://mary-lev.github.io/word2vec_explorer

Interactive visualization of semantic spaces in canonical and naive Russian poetry using Word2Vec embeddings.

## 🎯 Features

- **Interactive Word Analysis**: Type any word to explore its semantic neighborhood
- **t-SNE Visualization**: Real-time 2D projection of high-dimensional word embeddings
- **Comparative Analysis**: Side-by-side comparison of canonical vs naive poetry corpora
- **Semantic Metrics**: Cosine similarity, neighbor overlap, and shift classification
- **Academic Design**: Clean white/blue interface suitable for research presentations

## 🚀 Usage

1. Visit https://mary-lev.github.io/word2vec_explorer
2. Enter a Russian word (e.g., поэзия, любовь, душа)
3. Explore the interactive t-SNE visualization
4. Click on neighboring words to navigate through semantic space
5. Compare semantic relationships across different poetry traditions

## 🔬 Research Context

This tool visualizes the semantic differences between:
- **Canonical Poetry**: Classical Russian literary works
- **Naive Poetry**: Contemporary poetry from online platforms (Stihi.ru)

The visualization reveals how word meanings and usage contexts differ between traditional and modern poetic expression.

## 🛠 Technical Details

- **Models**: Word2Vec embeddings trained on Russian poetry corpora
- **Alignment**: Procrustes analysis for cross-corpus comparison  
- **Visualization**: t-SNE dimensionality reduction with interactive Plotly charts
- **Framework**: Vanilla JavaScript with Bootstrap styling

## 📊 Data

Currently includes demo data for:
- поэзия (poetry)
- любовь (love)  
- душа (soul)

Each word includes:
- Semantic neighbors in both corpora
- Similarity scores
- t-SNE coordinates for visualization
- Shift type classification

## 📖 Citation

If you use this tool in your research, please cite:

```
Semantic Poetry Explorer. Interactive visualization of Russian poetry embeddings.
Available at: https://mary-lev.github.io/word2vec_explorer
```

## 📧 Contact

For questions about the research or tool, please contact the author.

---

*Built with ❤️ for digital humanities research*