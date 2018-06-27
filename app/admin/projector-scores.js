/* global Vue, auth, firestore */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[2],

    globConfig: {},
    config: {},
    participants: {},
    scores: {},
    ranks: {},
    cycling: [],

    conns: [],

    loaded: {
      config: false,
      globConfig: false,
      participants: false,
      scores: false,
      ranks: true
    },
    loadCache: {}
  },
  computed: {
    loadedScores: function () {
      return Object.keys(this.loadCache).reduce(function (a, b) {
        if (!app.loadCache[a] || !app.loadCache[b]) return false
        if (app.loadCache[a] && app.loadCache[b]) return true
      })
    }
  },
  methods: {
    isSpeed: function (abbr) {
      return this.config.events[abbr].speed || false
    }
  }
})

firestore.collection(app.fed).doc('config')
  .onSnapshot(function (doc) {
    app.loaded.globConfig = true
    Object.assign(app.globConfig, doc.data())
    app.$set(app.globConfig, 'projector', doc.data().projector)

    for (let i = 0; i < app.conns.length; i++) {
      console.log('closing - config update')
      app.conns[i]()
    }
    app.conns = []
    app.cycling = []

    if (typeof app.globConfig.projector !== 'undefined' && typeof app.globConfig.projector.category !== 'undefined') {
      firestore.collection(app.fed).doc('categories').collection(app.globConfig.projector.category).doc('config')
        .onSnapshot(function (doc) {
          app.loaded.config = true
          Object.assign(app.config, doc.data())

          if (app.globConfig.projector.speed) {
            if (typeof app.ticker !== 'undefined') { clearInterval(app.ticker) }
            var abbrs = Object.keys(app.config.events).filter(app.isSpeed) || []
            console.log(abbrs)

            for (let i = 0; i < app.conns.length; i++) {
              console.log('closing - cat update')
              app.conns[i]()
            }
            app.conns = []
            app.cycling = []

            for (let i = 0; i < abbrs.length; i++) {
              if (typeof app.scores[abbrs[i]] === 'undefined') {
                app.$set(app.scores, abbrs[i], {})
              }

              app.conns.push(firestore.collection(app.fed).doc('categories').collection(app.globConfig.projector.category).doc('scores').collection(abbrs[i]).where('projector', '==', true)
                .onSnapshot(function (snapshot) {
                  snapshot.docChanges().forEach(function (change) {
                    let doc = change.doc

                    app.loadCache[abbrs[i] + change.doc.id] = true
                    app.$set(app.scores[abbrs[i]], change.doc.id, change.doc.data())

                    if (change.type === 'added' || change.type === 'modified') {
                      console.log(app.cycling)
                      if (app.cycling.findIndex(function (obj) { return obj.uid === doc.id && obj.abbr === abbrs[i] }) < 0) {
                        app.cycling.unshift({
                          uid: change.doc.id,
                          abbr: abbrs[i]
                        })
                      }
                    }

                    if (change.type === 'removed') {
                      app.$set(app.scores[abbrs[i]], doc.id, undefined)
                      let idx = app.cycling.findIndex(function (obj) { return obj.uid === change.doc.id && obj.abbr === abbrs[i] })
                      console.log(idx)
                      if (idx >= 0) {
                        app.cycling.splice(idx, 1)
                      }
                    }
                  })
                }))
            }
            app.ticker = setInterval(function () {
              app.cycling.unshift(app.cycling.pop())
            }, 5000)
          } else if (typeof app.globConfig.projector !== 'undefined' && typeof app.globConfig.projector.event !== 'undefined' && !app.globConfig.projector.speed) {
            if (typeof app.scores[app.globConfig.projector.event.abbr] === 'undefined') {
              app.$set(app.scores, app.globConfig.projector.event.abbr, {})
            }

            for (let i = 0; i < app.conns.length; i++) {
              app.conns[i]()
            }
            app.conns = []
            if (typeof app.ticker !== 'undefined') { clearInterval(app.ticker) }
            app.cycling = []

            app.conns.push(firestore.collection(app.fed).doc('categories').collection(app.globConfig.projector.category).doc('scores').collection(app.globConfig.projector.event.abbr).doc(app.globConfig.projector.event.uid)
              .onSnapshot(function (doc) {
                app.loaded.scores = true
                app.$set(app.scores[app.globConfig.projector.event.abbr], app.globConfig.projector.event.uid, doc.data())
              }))
          }
        })

      firestore.collection(app.fed).doc('categories').collection(app.globConfig.projector.category).doc('participants')
        .onSnapshot(function (doc) {
          app.loaded.participants = true
          Object.assign(app.participants, doc.data())
        })
    }
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
