/* global Vue, auth, firestore */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[1],
    cat: window.location.pathname.split('/')[2],
    abbr: window.location.pathname.split('/')[3],

    config: {},
    participants: {},
    scores: {},
    ranks: {},

    loaded: {
      config: false,
      participants: false,
      scores: false,
      ranks: false
    }
  },
  methods: {
    unabbr: function (abbr) {
      if (typeof this.config.events !== 'undefined' && typeof this.config.events[abbr] !== 'undefined') {
        return this.config.events[abbr].name || abbr
      }
      return abbr
    },
    showCol: function (col) {
      if (typeof this.config.events !== 'undefined' &&
          typeof this.config.events[this.abbr] !== 'undefined' &&
          typeof this.config.events[this.abbr].cols !== 'undefined' &&
          typeof this.config.events[this.abbr].cols.event !== 'undefined') {
        return this.config.events[this.abbr].cols.event.indexOf(col) >= 0
      }
      return false
    },
    colCount: function () {
      if (typeof this.config.events !== 'undefined' && typeof this.config.events[this.abbr] !== 'undefined' &&
          typeof this.config.events[this.abbr].cols !== 'undefined' &&
          typeof this.config.events[this.abbr].cols.event !== 'undefined') {
        return this.config.events[this.abbr].cols.event.length || 0
      }
      return 0
    }
  }
})

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config')
  .onSnapshot(function (doc) {
    app.loaded.config = true
    Object.assign(app.config, doc.data())
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('participants')
  .onSnapshot(function (doc) {
    app.loaded.participants = true
    Object.assign(app.participants, doc.data())
    // app.particiants = doc.data()
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(app.abbr)
  .onSnapshot(function (docs) {
    app.loaded.scores = true

    docs.forEach(function (doc) {
      app.$set(app.scores, doc.id, doc.data())
    })
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('ranks').collection(app.abbr)
  .onSnapshot(function (docs) {
    app.loaded.ranks = true

    docs.forEach(function (doc) {
      app.$set(app.ranks, doc.id, doc.data())
    })
  })

auth.onAuthStateChanged(function (user) {
  if (user) {
    if (user.isAnonymous) {
      auth.signOut()
    }
    app.user = user
    // if user is signed in, check if the user is admin.
    // Is trickable, but they won't be able to actually
    // edit anything and all they'll access is already publicly readable
  }
})
