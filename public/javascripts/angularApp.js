var mainCtrl = function($scope, posts, auth) {
  $scope.test = 'Hello world!';
  $scope.posts = posts.posts

  $scope.addPost = function(){
    if(!$scope.title || $scope.title === ''){
      console.log('not allowed');
      return;
    }

    posts.create({
      title: $scope.title,
      link:  $scope.link
    });
    
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementUpvote = function(post) {
    posts.upvote(post);
  };

  $scope.isLoggedIn = auth.isLoggedIn;
}    

var postsCtrl = function($scope, $stateParams, posts, post, auth){
  $scope.post = post;

  $scope.addComment = function(){
    if($scope.body === ''){ return; }

    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user'
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    
    $scope.body = '';
  };

  $scope.incrementUpvote = function(comment){
    posts.upvoteComment(post, comment);
  };

  $scope.isLoggedIn = auth.isLoggedIn;
};

var authCtrl = function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
};

var navCtrl = function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
};

var postFactory = function($http, auth){
  var o = {
    posts: []
  };

  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

  o.create = function(post) {
    return $http.post('/posts', post, {
      headers: { Authorization: 'Bearer '+ auth.getToken() }
    }).success(function(data) {
      o.posts.push(data);
    });
  };

  o.upvote = function(post){
    return $http.put('/posts/'+ post._id + '/upvote', null ,{
      headers: { Authorization: 'Bearer '+ auth.getToken() }
    }).success(function(data) {
	post.upvotes += 1;
    });
  };

  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res) {
      return res.data;
    });
  };

  o.addComment = function(id, comment){
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: { Authorization: 'Bearer '+ auth.getToken() }
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
      headers: { Authorization: 'Bearer '+ auth.getToken() }
    }).success(function(data) {
	comment.upvotes += 1;
      });
  };
  
  return o;
};

var authFactory = function($http, $window){
  var auth = {};

  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['flapper-news-token'];
  };

  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };

  return auth;
};

angular.module('flapperNews', ['ui.router'])
  .factory('posts',['$http', 'auth', postFactory])
  .factory('auth', ['$http', '$window', authFactory])
  .controller('MainCtrl',
	      ["$scope",
	       "posts",
               "auth",
	       mainCtrl])
  .controller('PostsCtrl',
	      ['$scope',
	       '$stateParams',
	       'posts',
	       'post',
               "auth",
	       postsCtrl])
  .controller('AuthCtrl', 
              ['$scope',
               '$state',
               'auth',
               authCtrl])
  .controller('NavCtrl',
             ['$scope',
              'auth',
              navCtrl])
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
      $stateProvider
	.state('home', {
	  url: '/home',
	  templateUrl: '/home.html',
	  controller: 'MainCtrl',
	  resolve: {
	    postPromise: ['posts', function(posts){
	      return posts.getAll();
	    }]
	  }
	})
	.state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl',
	  resolve: {
	    post: ['$stateParams', 'posts', function($stateParams, posts){
	      return posts.get($stateParams.id);
	    }]
	  }
	})
        .state('register', {
          url: '/register',
          templateUrl: '/register.html',
          controller: 'AuthCtrl',
          onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
              $state.go('home');
            }
          }]
        })
        .state('login', {
          url: '/login',
          templateUrl: '/login.html',
          controller: 'AuthCtrl',
          onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
              $state.go('home');
            }
          }]
        });

      $urlRouterProvider.otherwise('home');
    }
  ]);
