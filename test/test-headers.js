(function(qunit, $) {
	'use strict';
	
	var t = qunit.test;
	
	/* -------------------- */
	qunit.module( 'Headers' );
	/* -------------------- */
	
	t('headers can be inspected via setRequestHeader()', function(assert) {
		var done = assert.async();
		
		assert.expect(1);

		$(document).ajaxSend(function(event, xhr) {
			xhr.setRequestHeader('X-CSRFToken', '<this is a token>');
		});

		$.mockjax( function ( requestSettings ) {
			var key;
			
			if ('/inspect-headers' === requestSettings.url) {
				return {
					response: function() {
						if (typeof requestSettings.headers['X-Csrftoken'] !== 'undefined') {
							key = 'X-Csrftoken';  // bugs in jquery 1.5
						} else {
							key = 'X-CSRFToken';
						}
						assert.equal(requestSettings.headers[key], '<this is a token>');
						this.responseText = {};
					}
				};
			}
		});

		$.ajax({
			url: '/inspect-headers',
			complete: done
		});
	});

	t('Response status callback', function(assert) {
		var done = assert.async();
		
		$.mockjax({
			url: '/response-callback',
			status: 403
		});

		$.ajax({
			url: '/response-callback',
			success: function() {
				assert.ok(false, 'Success handler should not have been called');
			},
			complete: function(xhr) {
				assert.equal(xhr.status, 403, 'response status matches');
				done();
			}
		});
	});
	
	t('Setting the content-type', function(assert) {
		var done = assert.async();
		
		$.mockjax({
			url: '/response-callback',
			contentType: 'text/json',
			responseText: {
				foo: 'bar'
			}
		});

		$.ajax({
			url: '/response-callback',
			dataType: 'json',
			error: qunit.noErrorCallbackExpected,
			success: function(json) {
				assert.deepEqual(json, { 'foo' : 'bar' }, 'JSON Object matches');
			},
			complete: function(xhr) {
				assert.equal(xhr.getResponseHeader('Content-Type'), 'text/json', 'Content type of json');
				done();
			}
		});
	});
	
	t('Setting additional HTTP response headers', function(assert) {
		var done = assert.async();
		
		$.mockjax({
			url: '/response-callback',
			headers: {
				'X-Must-Exist': 'yes'
			},
			responseText: 'done'
		});

		$.ajax({
			url: '/response-callback',
			error: qunit.noErrorCallbackExpected,
			success: function(response) {
				assert.equal( response, 'done', 'Response text matches' );
			},
			complete: function(xhr) {
				assert.equal(xhr.getResponseHeader( 'X-Must-Exist' ), 'yes', 'Header matches');
				done();
			}
		});
	});

	t('Testing that request headers do not overwrite response headers', function(assert) {
		var done = assert.async();
		
		$.mockjax({
			url: '/restful/fortune',
			headers : {
				prop: 'response'
			}
		});

		var returnedXhr = $.ajax({
			type: 'GET',
			url: '/restful/fortune',
			headers : {
				prop : 'request'
			},
			success: function(res, status, xhr) {
				if (xhr) {
					assert.equal(xhr && xhr.getResponseHeader('prop'), 'response', 'response header should be correct');
				} else {
					assert.equal(returnedXhr.getResponseHeader('prop'), 'response', 'response header should be correct');
				}
			},
			error: qunit.noErrorCallbackExpected,
			complete: done
		});
	});
	
})(window.QUnit, window.jQuery);