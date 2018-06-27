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
      ranks: true
    }
  },
  computed: {
    ranked: function () {
      var self = this
      var uids = Object.keys(this.scores) || []
      return uids.filter(function (uid) {
        return typeof self.scores[uid] !== 'undefined'
      }).map(function (uid) {
        var score = self.scores[uid]
        score.uid = uid
        return score
      }).sort(function (a, b) {
        if (typeof a.rank !== 'undefined' && typeof b.rank !== 'undefined' && a.rank !== b.rank) return a.rank - b.rank
        if (typeof a.A !== 'undefined' && typeof b.A !== 'undefined' && a.A !== b.A) return b.A - a.A
        if (typeof a.Y !== 'undefined' && typeof b.Y !== 'undefined' && a.Y !== b.Y) return b.Y - a.Y
        return Number(a.uid) - Number(b.uid)
      })
    },
    percentage: function () {
      var self = this
      var arr = Object.keys(this.loaded)
      var n = arr.length
      var loaded = arr.filter(function (thing) {
        return self.loaded[thing]
      }).length
      console.log(this.loaded, arr, loaded, n)
      return (loaded / n) * 100 + '%'
    },
    anyMembers: function () {
      var self = this
      return Object.keys(this.participants).map(function (uid) {
        return self.participants[uid].members
      }).filter(function (members) {
        return typeof members !== 'undefined'
      }).length > 0
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
    let data = doc.data()
    Object.keys(data).forEach(function (uid) {
      app.$set(app.participants, uid, data[uid])
    })
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(app.abbr).where('display', '==', true)
  .onSnapshot(function (docs) {
    app.loaded.scores = true

    docs.docChanges().forEach(function (change) {
      let doc = change.doc
      console.log(doc.id, change)
      if (change.type === 'removed') return app.$set(app.scores, doc.id, undefined)
      app.$set(app.scores, doc.id, doc.data())
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
