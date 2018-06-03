/* global Vue, auth, firestore, firebase */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[2],
    cat: window.location.pathname.split('/')[3],

    globConfig: {
      projector: {}
    },
    config: {},
    participants: {},
    scores: {
      overall: {}
    },

    loaded: {
      config: false,
      participants: false,
      scores: false,
      globConfig: false
    }
  },
  computed: {
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
  },
  methods: {
    isType: function (abbr, type) {
      var abbrType = abbr.substring(0, 2)
      return (abbrType.toLowerCase() === type.toLowerCase())
    },
    isSpeed: function (abbr) {
      return this.config.events[abbr].speed || false
    },
    togglePub: function (evt, uid) {
      var val = true
      if (evt === 'overall') {
        val = !this.scores.overall[uid].display
      } else {
        val = !this.scores[evt][uid].display
      }
      firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(evt).doc(uid).update({display: val})
    },
    toggleCatVisibility: function () {
      return firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config').update({visible: !this.config.visible})
    },
    display: function (abbr, uid) {
      if (this.isSpeed(abbr)) {
        firestore.collection(app.fed).doc('config').update({
          projector: {
            category: this.cat,
            speed: true
          }
        })
        firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(abbr).doc(uid).update({
          projector: !this.scores[abbr][uid].projector
        })
      } else {
        if (typeof app.globConfig.projector !== 'undefined' &&
            app.globConfig.projector.category === this.cat &&
            typeof app.globConfig.projector.event !== 'undefined' &&
            app.globConfig.projector.event.abbr === abbr &&
            app.globConfig.projector.event.uid === uid) {
          firestore.collection(app.fed).doc('config').update({
            projector: firebase.firestore.FieldValue.delete()
          })
        } else {
          firestore.collection(app.fed).doc('config').update({
            projector: {
              category: this.cat,
              speed: false,
              event: {
                abbr: abbr,
                uid: uid
              }
            }
          })
        }
      }
    },
    onDisplay: function (abbr, uid) {
      var currDisp = this.globConfig.projector
      if (currDisp.speed) {
        return currDisp.category === this.cat && this.scores[abbr] && this.scores[abbr][uid] && this.scores[abbr][uid].projector
      } else {
        return currDisp.category === this.cat && typeof currDisp.event !== 'undefined' && currDisp.event.abbr === abbr && currDisp.event.uid === uid
      }
    }
  }
})

firestore.collection(app.fed).doc('config')
  .onSnapshot(function (doc) {
    app.loaded.globConfig = true
    Object.assign(app.globConfig, doc.data())
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config')
  .onSnapshot(function (doc) {
    app.loaded.config = true
    Object.assign(app.config, doc.data())

    var events = Object.keys(app.config.events)

    events.forEach(function (event) {
      app.$set(app.scores, event, {})

      firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(event)
        .onSnapshot(function (docs) {
          docs.forEach(function (doc) {
            app.$set(app.scores[event], doc.id, doc.data())
          })
        })
    })
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('participants')
  .onSnapshot(function (doc) {
    app.loaded.participants = true
    Object.assign(app.participants, doc.data())
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection('overall')
  .onSnapshot(function (docs) {
    app.loaded.scores = true

    docs.forEach(function (doc) {
      app.$set(app.scores.overall, doc.id, doc.data())
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
