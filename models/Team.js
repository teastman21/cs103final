'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var scheduleSchema = Schema( {
  userId: ObjectId,
  playerId: ObjectId,
} );

module.exports = mongoose.model( 'Team', scheduleSchema );
