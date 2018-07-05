/* global Vue, auth, firestore, firebase, confirm */
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
    },

    saveStatus: ''
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
    isType: function (abbr, type) {
      var abbrType = abbr.substring(0, 2)
      return (abbrType.toLowerCase() === type.toLowerCase())
    },
    isSpeed: function (abbr) {
      return this.config.events[abbr].speed || false
    },
    togglePub: function (abbr, uid, force) {
      let val = true
      if (force) {
        val = true
      } else {
        val = !this.scores[abbr][uid].display
      }
      if (this.scores[abbr][uid].dns) val = false

      firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(abbr).doc(uid).update({display: val})
    },
    delCat: function () {
      if (confirm('Are you sure you want to remove ' + app.config.name + '? This cannot be undone')) {
        firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config').set({delete: true}, {merge: true})
          .then(function () {
            window.location.pathname = '/admin/' + app.fed
          })
          .catch(function (err) {
            if (err) throw err
          })
      }
    },
    publishAll: function (abbr) {
      let participants = Object.keys(this.participants)
      for (var i = 0; i < participants.length; i++) {
        let uid = participants[i]
        if (typeof this.scores[abbr][uid] !== 'undefined') {
          this.togglePub(abbr, uid, true)
        }
      }
    },
    toggleCatVisibility: function () {
      return firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config').update({visible: !this.config.visible})
    },
    display: function (abbr, uid, force) {
      if (abbr === 'overall' || this.isSpeed(abbr)) {
        firestore.collection(app.fed).doc('config').update({
          projector: {
            category: app.cat,
            speed: (abbr === 'overall' ? app.globConfig.projector.speed : true)
          }
        })
        firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(abbr).doc(uid).update({
          projector: (force ? true : !this.scores[abbr][uid].projector)
        })
      } else {
        if (!force && typeof app.globConfig.projector !== 'undefined' &&
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
    displayAll: function (abbr) {
      let participants = Object.keys(this.participants)
      for (var i = 0; i < participants.length; i++) {
        let uid = participants[i]
        if (typeof this.scores[abbr][uid] !== 'undefined') {
          this.display(abbr, uid, true)
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
    },
    saveGroup: function () {
      return firestore.collection(app.fed).doc('categories').collection(app.cat).doc('config').update({group: app.config.group})
        .then(function () {
          app.saveStatus = 'Successfully saved'
          setTimeout(function () {
            app.saveStatus = ''
          }, 5000)
        })
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

    if (app.config.delete === true) {
      window.location.pathname = '/admin/' + app.fed
    }

    var events = Object.keys(app.config.events)
    events.push('overall')

    events.forEach(function (event) {
      app.$set(app.scores, event, {})

      firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection(event)
        .onSnapshot(function (docs) {
          app.loaded.scores = true
          docs.docChanges().forEach(function (change) {
            let doc = change.doc
            if (change.type === 'removed') return app.$set(app.scores[event], doc.id, undefined)
            app.$set(app.scores[event], doc.id, doc.data())
          })
        })
    })
  })

firestore.collection(app.fed).doc('categories').collection(app.cat).doc('participants')
  .onSnapshot(function (doc) {
    app.loaded.participants = true
    let data = doc.data()
    Object.keys(data).forEach(function (uid) {
      app.$set(app.participants, uid, data[uid])
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
