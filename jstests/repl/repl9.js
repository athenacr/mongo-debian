// Test replication of collection renaming

baseName = "jstests_repl_repl9";

ports = allocatePorts( 2 );

m = startMongod( "--port", ports[ 0 ], "--dbpath", "/data/db/" + baseName + "-master", "--master", "--oplogSize", "1", "--nohttpinterface", "--noprealloc", "--bind_ip", "127.0.0.1" );
s = startMongod( "--port", ports[ 1 ], "--dbpath", "/data/db/" + baseName + "-slave", "--slave", "--source", "127.0.0.1:" + ports[ 0 ], "--nohttpinterface", "--noprealloc", "--bind_ip", "127.0.0.1" );

admin = m.getDB( "admin" );

debug = function( foo ) {} // print( foo ); }

// rename within db

m.getDB( baseName ).one.save( { a: 1 } );
assert.soon( function() { v = s.getDB( baseName ).one.findOne(); return v && 1 == v.a } );

assert.commandWorked( admin.runCommand( {renameCollection:"jstests_repl_repl9.one", to:"jstests_repl_repl9.two"} ) );
assert.soon( function() {
	if ( -1 == s.getDB( baseName ).getCollectionNames().indexOf( "two" ) ) {
	    debug( "no two coll" );
	    debug( tojson( s.getDB( baseName ).getCollectionNames() ) );
	    return false;
	}
	if ( !s.getDB( baseName ).two.findOne() ) {
	    debug( "no two object" );
	    return false;
	}
	    return 1 == s.getDB( baseName ).two.findOne().a; });
assert.eq( -1, s.getDB( baseName ).getCollectionNames().indexOf( "one" ) );

// rename to new db

first = baseName + "_first";
second = baseName + "_second";

m.getDB( first ).one.save( { a: 1 } );
assert.soon( function() { return s.getDB( first ).one.findOne() && 1 == s.getDB( first ).one.findOne().a; } );

assert.commandWorked( admin.runCommand( {renameCollection:"jstests_repl_repl9_first.one", to:"jstests_repl_repl9_second.two"} ) );
assert.soon( function() {
	return -1 != s.getDBNames().indexOf( second ) &&
	    -1 != s.getDB( second ).getCollectionNames().indexOf( "two" ) &&
	    s.getDB( second ).two.findOne() &&
	    1 == s.getDB( second ).two.findOne().a; } );
assert.eq( -1, s.getDB( first ).getCollectionNames().indexOf( "one" ) );

