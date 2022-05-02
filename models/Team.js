'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var teamSchema = Schema( {
  userId: ObjectId,
  playerId: ObjectId,
} );

module.exports = mongoose.model( 'Team', teamSchema );
