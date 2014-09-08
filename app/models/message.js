'use strict';

var async = require('async'),
    Mongo  = require('mongodb');

function Message(senderId, receiverId, subject, message){
  this.senderId   = senderId;
  this.receiverId = receiverId;
  this.subject    = subject;
  this.message    = message;
  this.date       = new Date();
  this.isRead     = false;
}

Object.defineProperty(Message, 'collection', {
  get: function(){return global.mongodb.collection('messages');}
});

Message.countForUser = function(userId, cb){
  Message.collection.count({receiverId:userId, isRead:false}, cb);
};

Message.read = function(id, cb){
  var _id = Mongo.ObjectID(id);
  Message.collection.findAndModify({_id:_id}, [], {$set:{isRead:true}}, function(err, msg){
    iterator(msg, cb);
  });
};

Message.send = function(senderId, receiverId, subject, message, cb){
  var m = new Message(senderId, receiverId, subject, message);
  Message.collection.save(m, cb);
};

Message.unread = function(receiverId, cb){
  Message.collection.find({receiverId:receiverId, isRead:false}).count(cb);
};

Message.findAllForUser = function(receiverId, cb){
  Message.collection.find({receiverId:receiverId}).sort({date:-1}).toArray(function(err, msgs){
    async.map(msgs, iterator, cb);
  });
};

module.exports = Message;

function iterator(msg, cb){
  require('./user').findById(msg.senderId, function(err, sender){
    msg.sender = sender;
    cb(null, msg);
  });
}
