/* global Vue, auth, firestore */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[2],
    cat: '',

    conns: [],

    config: {},
    globConfig: {},
    participants: {},
    scores: {},
    ranks: {},

    loaded: {
      config: false,
      globConfig: false,
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
        if (typeof a.score !== 'undefined' && typeof b.score !== 'undefined' && a.score !== b.score) return b.score - a.score
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
      let count = 0
      if (typeof this.config.events !== 'undefined') {
        for (let abbr in this.config.events) {
          if (app.isType(abbr, type)) count += 1
        }
        console.log(type, count)
        return count
      }
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
    }
  }
})

firestore.collection(app.fed).doc('config')
.onSnapshot(function (doc) {
  app.loaded.globConfig = true

  app.$set(app.globConfig, 'projector', doc.data().projector)
  app.cat = app.globConfig.projector.category

  for (let i = 0; i < app.conns.length; i++) {
    console.log('closing - config update')
    app.conns[i]()
  }
  app.conns = []

  app.conns.push(firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config')
    .onSnapshot(function (doc) {
      app.loaded.config = true
      let data = doc.data()
      Object.assign(app.config, data)
      app.$set(app.config, 'events', data.events)
    }))

  app.conns.push(firestore.collection(app.fed).doc('categories').collection(app.cat).doc('participants')
    .onSnapshot(function (doc) {
      app.loaded.participants = true
      let data = doc.data()
      app.participants = {}
      Object.keys(data).forEach(function (uid) {
        app.$set(app.participants, uid, data[uid])
      })
    }))

  app.conns.push(firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection('overall').where('projector', '==', true)
    .onSnapshot(function (docs) {
      app.loaded.scores = true
      app.scores = {}
      docs.docChanges().forEach(function (change) {
        let doc = change.doc
        if (change.type === 'removed') return app.$set(app.scores, doc.id, undefined)
        app.$set(app.scores, doc.id, doc.data())
      })
    }))
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
