/* global firebase, auth, Vue */
var app = new Vue({
  el: '#app',
  data: {
    user: undefined,
    admin: undefined,
    confirmationResult: undefined,
    override: true,
    display: {
      'password': true,
      'phone': false,
      'google.com': false,
      'twitter.com': false,
      'facebook.com': false,
      'phoneCode': false,
      'forgot': false
    },
    errors: {
      social: '',
      email: '',
      phone: ''
    },
    auth: {
      email: '',
      password: '',
      phone: '+46',
      phoneCode: ''
    },
    providers: {
      google: new firebase.auth.GoogleAuthProvider(),
      facebook: new firebase.auth.FacebookAuthProvider(),
      twitter: new firebase.auth.TwitterAuthProvider()
    }
    // recaptchaVerifier: new firebase.auth.RecaptchaVerifier('phone-sign-in', {
    //   'size': 'invisible',
    //   'callback': function (response) {
    //     // reCAPTCHA solved, allow signInWithPhoneNumber.
    //     app.test = true
    //   }
    // })
  },
  methods: {
    Error: function (what, error) {
      this.errors[what] = error.code + ' - ' + error.message
    },

    phoneSendCode: function () {
      var appVerifier = this.recaptchaVerifier
      var self = this

      if (this.user) {
        this.user
          .linkWithPhoneNumber(this.auth.phone, appVerifier)
          .then(function (confirmationResult) {
            // SMS sent. Prompt user to type the code from the message, then sign the
            // user in with confirmationResult.confirm(code).
            app.confirmationResult = confirmationResult
            self.display.phoneCode = true
          })
          .catch(function (err) {
            // Error; SMS not sent
            self.recaptchaVerifier.render()
              .then(function (widgetId) {
                self.recaptchaVerifier.reset(widgetId)
              })
            self.Error('phone', err)
          })
      } else {
        firebase.auth()
          .signInWithPhoneNumber(this.auth.phone, appVerifier)
          .then(function (confirmationResult) {
            // SMS sent. Prompt user to type the code from the message, then sign the
            // user in with confirmationResult.confirm(code).
            app.confirmationResult = confirmationResult
            self.display.phoneCode = true
          })
          .catch(function (err) {
            // Error; SMS not sent
            self.recaptchaVerifier.render()
              .then(function (widgetId) {
                self.recaptchaVerifier.reset(widgetId)
              })
            self.Error('phone', err)
          })
      }
    },

    phoneSignIn: function () {
      var self = this
      this.confirmationResult.confirm(this.auth.phoneCode)
        .then(function (user) {
          self.confirmationResult = undefined
          self.display.phoneCode = false
        })
        .catch(function (err) {
        // User couldn't sign in (bad verification code?)
          self.Error('phone', err)
        })
    },

    socialSignIn: function (what) {
      var self = this
      if (this.user) {
        this.user.linkWithPopup(this.providers[what])
          .then(function () {
            self.display[what + '.com'] = false
          })
          .catch(function (err) {
            self.Error('social', err)
          })
      } else {
        auth.signInWithPopup(this.providers[what])
          .catch(function (err) {
            self.Error('social', err)
          })
      }
    },

    emailSignIn: function () {
      var self = this
      auth.signInWithEmailAndPassword(this.auth.email, this.auth.password)
        .catch(function (err) {
          self.Error('email', err)
        })
    },

    emailSignUp: function () {
      var self = this
      var email = this.auth.email
      var password = this.auth.password
      auth.createUserWithEmailAndPassword(email, password)
        .then(function (user) {
          user.sendEmailVerification()
          self.auth.email = email
          self.auth.password = password
          self.signIn('email')
        })
        .catch(function (err) {
          self.Error('email', err)
        })
    },

    forgotEmail: function () {
      var self = this
      var email = this.auth.email
      auth.sendPasswordResetEmail(email).then(function () {
        self.display.forgot = false
        self.Error('email', {code: 'auth/email-sent', message: 'Password reset email sent successfully'})
      }).catch(function (err) {
        self.Error('email', err)
      })
    },

    signIn: function (what) {
      if (what === 'google' || what === 'facebook' || what === 'twitter') {
        this.socialSignIn(what)
      } else if (what === 'email') {
        this.emailSignIn()
      } else if (what === 'phone') {
        if (this.confirmationResult) {
          this.phoneSignIn()
        } else {
          this.phoneSendCode()
        }
      }
    },

    change: function (what) {
      var self = this
      if (what === 'email') {
        this.user.updateEmail(this.auth.email)
          .then(function () {
            self.user.sendEmailVerification()
          })
          .catch(function (err) {
            self.Error('email', err)
          })
      } else if (what === 'password') {
        if (!this.display.password) {
          this.user.updatePassword(this.auth.password)
            .catch(function (err) {
              self.Error('email', err)
            })
        } else {
          var credential = new firebase.auth.EmailAuthProvider.credential(this.auth.email, this.auth.password) // eslint-disable-line
          this.user.linkWithCredential(credential)
            .then(function () {
              self.display.password = false
            })
            .catch(function (err) {
              self.Error('email', err)
            })
        }
      } else if (what === 'phone') {
        self.Error('phone', {code: 'auth/not-implemented', message: 'This is not yet implemented, the developer went to bed'})
      }
    },

    forgot: function (what) {
      if (what === 'email') {
        this.forgotEmail()
      }
    }
  }
})

app.providers.facebook.setCustomParameters({
  'display': 'popup'
})

auth.onAuthStateChanged(function (user) {
  var k = Object.keys(app.display)
  var i

  for (i = 0; i < k.length; i++) {
    if (app.display[k[i]] === false && k[i] !== 'phoneCode' && k[i] !== 'forgot') {
      app.display[k[i]] = true
    }
    if (app.display[k[i]] === true && k[i] === 'phoneCode') {
      app.display[k[i]] = false
    }
  }
  app.user = undefined
  app.auth = {
    email: '',
    password: '',
    phone: '+46',
    phoneCode: ''
  }

  if (user) {
    app.user = user
    var p = user.providerData

    for (i = 0; i < p.length; i++) {
      if (app.display[p[i].providerId] === true) {
        app.display[p[i].providerId] = false
      }
    }
    app.display.forgot = false

    app.auth.email = user.email || ''
    app.auth.phone = user.phoneNumber || '+46'
  }
})
