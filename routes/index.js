var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function(err, post) {
    if(err) { return next(err); }
    if(!post) {return next(new Error('can\'t find post'));}

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if(err) { return next(err); }
    if(!comment) {return next(new Error('can\'t find comment'));}

    req.comment = comment;
    return next();
  });
});

router.param('user', function(req, res, next, id){
  var query = User.findById(id);

  query.select("username numPosts numComments posts comments");

  query.exec(function(err, user){
    if(err) { return next(err); }
    if(!user) { return next(new Error('can\'t find user')); }

    req.user = user;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){return next(err);}

    res.json(posts);
  });
});

router.post('/posts', auth, function(req, res, next) {
  console.log('post to /posts. req.body = ' + req.body.title);
  var post = new Post(req.body);
  var date = new Date();
  
  post.author = req.payload.username;
  post.user = req.payload._id;
  post.dateCreated = date;

  post.save(function(err, post) {
    if(err) { return next(err); }
    User.findById(req.payload._id, function(err, user){
      if (err) {return next(err);}

      user.numPosts += 1;
      user.posts.push(post._id);
      user.save(function(err){
        if(err) {return next(err);}
        console.log('saved user');
      });
    });
    res.json(post);
    
  });
});

router.get('/posts/:post', function(req, res) {
  req.post.populate('comments', function(err, post) {
    if (err) {return next(err); }
      req.post.populate('user', function(err, post){
        if(err) {return next(err);}

        console.log(req.post);
        res.json(req.post);
      });
  });
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post) {
    if(err) { return next(err); }

    res.json(post);
  });
});

router.get('/posts/:post/comments/:comment', function(req, res, next) {
  res.json(req.comment);
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;

  comment.save(function(err, comment) {
    if(err) {return next(err); }

    req.post.numComments += 1;
    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err) { return next(err); }
      User.findById(req.payload._id, function(err, user){
        if(err) { return next(err); }

        user.numComments += 1;
        user.comments.push(comment._id);
        user.save(function(err){
          if(err) { return next(err); }
          console.log('saved user');
        });
      });
      
      res.json(comment);
    });
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment) {
    if(err) { return next(err); }

    res.json(comment);
  });
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.get('/users', function(req, res, next){
  var query = User.find();

  query.select('username numPosts numComments posts comments');

  query.exec(function(err, users){
    if(err) {return next(err); }

    res.json(users);
  }); 
});

router.get('/users/:user', function(req, res, next){
  var comments = req.user.comments;
  var posts = req.user.posts;

  var hasComments = !(comments === undefined || comments.length === 0);
  var hasPosts = !(posts === undefined || posts.length === 0);
  var hasBoth = (hasComments && hasPosts);

  if(hasBoth){
    req.user.populate('posts', function(err, user){
      if(err) { return next(err); }
      req.user.populate('comments', function(err, user){
        if(err) { return next(err); }

        res.json(user);})
    });
  } else if (hasPosts){
    req.user.populate('posts', function(err, user){
      if(err) { return next(err); }

      res.json(user);})
  } else {
    req.user.populate('comments', function(err, user){
      if(err) { return next(err); }

      res.json(user);})
  }
});

module.exports = router;
