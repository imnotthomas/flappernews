var mainCtrl = function($scope, posts) {
    $scope.test = 'Hello world!';
    $scope.posts = posts.posts

    $scope.addPost = function(){
	if(!$scope.title || $scope.title === ''){
	    console.log('not allowed');
	    return;
	}
	
	$scope.posts.push({title: $scope.title,
			   link: $scope.link,
			   upvotes: 0,
			   comments: [
			       {author: 'Thomas', body: 'Cool post!', upvotes: 0},
			       {author: 'Lauren', body: 'Great idea!', upvotes: 0}
			   ]
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

var postFactory = function(){
    var o = {
	posts: [
	    {title: "post 1", upvotes: 1},
	    {title: "post 2", upvotes: 2},
	    {title: "post 3", upvotes: 3},
	    {title: "post 4", upvotes: 4},
	    {title: "post 5", upvotes: 5},
	    {title: "post 6", upvotes: 6}]
    };
    return o;
};

angular.module('flapperNews', ['ui.router'])
    .factory('posts',[postFactory])
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
		    controller: 'MainCtrl'
		})
		.state('posts', {
		    url: '/posts/{id}',
		    templateUrl: '/posts.html',
		    controller: 'PostsCtrl'
		});

	    $urlRouterProvider.otherwise('home');
	}
    ]);
