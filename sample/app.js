const app = Vue.createApp({
    data() {
        return {
            url: "https://kirkbesa.framer.website/",
            showBooks: true,
            books: [
                { title: "book 1", author: "author 1", isFav: true },
                { title: "book 2", author: "author 2", isFav: false },
                { title: "book 3", author: "author 3", isFav: true }
            ]
        }
    },
    methods: {
        fetchBooks() {
            this.showBooks = !this.showBooks
        },
        toggleFav(book) {
            book.isFav = !book.isFav
        }
    },
    computed: {
        filteredBooks() {
            return this.books.filter((book) => book.isFav)
        }
    }
})

app.mount('#app')