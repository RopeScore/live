/* global firebase, Cookies */
/**
 * shorthand for firebase.firestore()
 * @type {Object}
 */
var firestore = firebase.firestore().collection('live').doc('federations') // eslint-disable-line
/**
 * shorthand for firebase.auth()
 * @type {Object}
 */
var auth = firebase.auth()

/**
 * toggles classes for the navbar
 * @return {undefined} Alters DOM without return
 * @function
 */
function toggleNav () { // eslint-disable-line
  document.getElementsByClassName('topnav')[0].classList.toggle('responsive')
  document.getElementsByTagName('nav')[0].classList.toggle('responsive')
}

/**
 * Function to navigate to /, or /admin
 * @return {undefined} does not return, modifies location
 */
function goHome () { // eslint-disable-line
  if (/^\/admin/.test(window.location.pathname)) {
    window.location.pathname = '/admin'
  } else {
    window.location.pathname = '/'
  }
}

/**
 * signs out
 * @return {undefined}
 */
function signOut () { // eslint-disable-line
  auth.signOut()
}

/**
 * when the auth state updtes, update login button to login/logout
 * @param  {Object} user auth objec with user details
 * @return {undefined}   does not return, modifies DOM
 */
auth.onAuthStateChanged(function (user) {
  if (user) {
    document.getElementById('login').innerHTML = '<a onclick="signOut()">Log Out</a>'
    Cookies.set('ropescore_uid', user.uid)
  } else {
    document.getElementById('login').innerHTML = '<a href="/login">Log In</a>'
    Cookies.remove('ropescore_uid')
  }
})
