/* global Vue, auth, firestore, confirm */
var app = new Vue({
  el: '#app',
  data: {
    error: undefined,
    user: undefined,
    admin: false,
    override: true,

    fed: window.location.pathname.split('/')[2],

    config: {
      apikey: '',
      genKey: false,
      admins: {},
      newAdmins: []
    },
    show: {
      writeKey: false,
      readKey: false
    },
    newAdminEmail: ''
  },
  methods: {
    newKey: function () {
      if (confirm('Generating a new API-key will require you to reconfigure all connected scoring systems with the new API key. Generating a new API key cannot be undone, are you sure you want to proceed?')) {
        firestore.collection(app.fed).doc('config').update({genKey: true})
      }
    },
    copy: function (id) {
      var self = this
      var cache = self.show[id]
      this.show[id] = true
      setTimeout(function () {
        var copyText = document.getElementById(id)
        copyText.select()
        document.execCommand('Copy')
        self.show[id] = cache
        console.log('copied', id)
      })
    },
    newAdmin: function () {
      let self = this
      this.config.newAdmins.push(this.newAdminEmail)
      firestore.collection(app.fed).doc('config').update({newAdmins: this.config.newAdmins}).then(function () {
        self.newAdminEmail = ''
      })
    },
    delAdmin: function (uid) {
      delete this.config.admins[uid]
      firestore.collection(app.fed).doc('config').update({admins: this.config.admins})
    }
  }
})

firestore.collection(app.fed).doc('config')
  .onSnapshot(function (doc) {
    Object.assign(app.config, doc.data())
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
