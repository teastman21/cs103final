'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var courseSchema = Schema( {
    firstName: String,
    lastName: String,
    playerId: Number,
    teamId: Number,
} );

module.exports = mongoose.model( 'Player', courseSchema );
