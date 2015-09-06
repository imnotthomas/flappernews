var mainCtrl = function($scope, posts) {
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
	post.upvotes += 1;
    };
}    

var postsCtrl = function($scope, $stateParams, posts){
    $scope.post = posts.posts[$stateParams.id];

    $scope.addComment = function(){
	if($scope.body === ''){ return; }
	$scope.post.comments.push({
	    body: $scope.body,
	    author: 'user',
	    upvotes: 0
	});
	$scope.body = '';
    };
};

var postFactory = function($http){
    var o = {
	posts: []
    };

    o.getAll = function() {
	return $http.get('/posts').success(function(data) {
	    angular.copy(data, o.posts);
	});
    };

    o.create = function(post) {
	return $http.post('/posts', post).success(function(data) {
	    o.posts.push(data);
	});
    };
    
    return o;
};

angular.module('flapperNews', ['ui.router'])
    .factory('posts',['$http', postFactory])
    .controller('MainCtrl',
		["$scope",
		 "posts",
		 mainCtrl])
    .controller('PostsCtrl',
		['$scope',
		'$stateParams',
		'posts',
		 postsCtrl])
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
		    controller: 'PostsCtrl'
		});

	    $urlRouterProvider.otherwise('home');
	}
    ]);
