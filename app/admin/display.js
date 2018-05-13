/* global Vue, auth, firestore */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[1],

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

  },
  methods: {
  }
})

firestore.collection(app.fed).doc('config')
  .onSnapshot(function (doc) {
    app.loaded.config = true
    Object.assign(app.config, doc.data())
  })

// firestore.collection(app.fed).doc('categories').collection(app.cat).doc('participants')
//   .onSnapshot(function (doc) {
//     app.loaded.participants = true
//     Object.assign(app.participants, doc.data())
//   })
//
// firestore.collection(app.fed).doc('categories').collection(app.cat).doc('scores').collection('overall').where('display', '==', true)
//   .onSnapshot(function (docs) {
//     app.loaded.scores = true
//
//     docs.forEach(function (doc) {
//       app.$set(app.scores, doc.id, doc.data())
//     })
//   })

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
