var mainCtrl = function($scope) {
    $scope.test = 'Hello world!';
    $scope.posts = [
	{title: "post 1", upvotes: 1},
	{title: "post 2", upvotes: 2},
	{title: "post 3", upvotes: 3},
	{title: "post 4", upvotes: 4},
	{title: "post 5", upvotes: 5}
    ];

    $scope.addPost = function(){
	if(!$scope.title || $scope.title === ''){
	    console.log('not allowed');
	    return;
	}
	
	$scope.posts.push({title: $scope.title,
			   link: $scope.link,
			   upvotes: 0});
	$scope.title = '';
	$scope.link = '';
    };

    $scope.incrementUpvote = function(post) {
	post.upvotes += 1;
    };
}    


angular.module('flapperNews', [])
    .controller('MainCtrl',
		["$scope",
		 mainCtrl
		]
    );
