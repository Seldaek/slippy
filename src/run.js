$(function() {
	$('.slide').slippy({
	  ratio: 4 / 3,
	  incrementalBefore : function(el) { $(el).hide(); },
	  incrementalAfter  : function(el) { $(el).slideDown(); }
	});
	SyntaxHighlighter.all();
});
