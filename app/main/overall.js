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
      return uids.map(function (uid) {
        var score = self.scores[uid]
        score.uid = uid
        return score
      }).sort(function (a, b) {
        if (typeof a.rank !== 'undefined' && typeof b.rank !== 'undefined' && a.rank !== b.rank) return a.rank - b.rank
        if (typeof a.score !== 'undefined' && typeof b.score !== 'undefined' && a.score !== b.score) return b.score - a.score
        return Number(a.uid) - Number(b.uid)
      })
    },
    sortedEvents: function () {
      let self = this
      return Object.keys(this.config.events).map(function (abbr) {
        var obj = self.config.events[abbr]
        obj.abbr = abbr
        return obj
      }).sort(function (a, b) {
        if (self.isType(a.abbr, 'sr') !== self.isType(b.abbr, 'sr')) return self.isType(b.abbr, 'sr')
        if (a.speed !== b.speed) return b.speed
        return a.abbr.localeCompare(b.abbr)
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
    }
  },
  methods: {
    unabbr: function (abbr) {
      if (typeof this.config.events !== 'undefined' && typeof this.config.events[abbr] !== 'undefined') {
        return this.config.events[abbr].name || abbr
      }
      return abbr
    },
    trim: function (str) {
      return str.replace('Single Rope', '').replace('Double Dutch', '').trim()
    },
    showCol: function (abbr, col) {
      if (typeof this.config.events !== 'undefined' &&
          typeof this.config.events[abbr] !== 'undefined' &&
          typeof this.config.events[abbr].cols !== 'undefined' &&
          typeof this.config.events[abbr].cols.overall !== 'undefined') {
        return this.config.events[abbr].cols.overall.indexOf(col) >= 0
      }
      return false
    },
    isType: function (abbr, type) {
      var abbrType = abbr.substring(0, 2)
      return (abbrType.toLowerCase() === type.toLowerCase())
    },
    hasType: function (type) {
      if (typeof this.config.events === 'undefined') {
        return false
      }
      var keys = Object.keys(this.config.events)
      for (var i = 0; i < keys.length; i++) {
        if (this.config.events[keys[i]] && this.isType(keys[i], type.toLowerCase())) {
          return true
        }
      }
      return false
    },
    colCount: function (type) {
      var count = 0
      if (typeof this.config.events !== 'undefined') {
        for (var abbr in this.config.events) {
          if (typeof this.config.events[abbr] !== 'undefined' &&
              typeof this.config.events[abbr].cols !== 'undefined' &&
              typeof this.config.events[abbr].cols.overall !== 'undefined' &&
              (typeof type === 'undefined' ? true : this.isType(abbr, type))) {
            count += this.config.events[abbr].cols.overall.length || 0
          }
        }

        return count
      }
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
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection('overall').where('display', '==', true)
  .onSnapshot(function (docs) {
    app.loaded.scores = true

    docs.forEach(function (doc) {
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
