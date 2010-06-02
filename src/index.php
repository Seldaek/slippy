<?php

/**
 * Slippy
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * Version: 0.9.0
 */
define('SLIPPY_VERSION', '0.9.0');

// init
$dir = dirname(__FILE__).'/';
if (file_exists($dir.'config.php')) {
    include $dir.'config.php';
    $dir = rtrim($dir, '/').'/';
}

// fetch slide deck
$file = $dir . (isset($_GET['file']) ? basename($_GET['file']) : 'index.html');

// list slide decks if none is not found
if (!file_exists($file)) {
    echo '<h1>This is a Slippy Repository</h1><p>You can find the source for this application on <a href="http://github.com/Seldaek/slippy">github</a>, and browse the available slide decks in the list below.</p>';
    echo '<form action="" method="GET"><select name="file">';
    foreach(array_reverse(glob($dir.'*.html')) as $file) {
        $file = htmlentities(basename($file));
        echo '<option value="'.$file.'">'.$file.'</option>';
    }
    echo '</select><input type="submit" value="Start" /></form>';
    die;
}

// display slide deck
$file = file_get_contents($file);
if (!isset($_GET['raw']) || !$_GET['raw']) {
    $file = preg_replace_callback('#<meta name="syntax_highlighter" content="(.+?)" />#', 'slippy_init', $file);
}
$file = preg_replace_callback('{(<pre[^>]+>)(.+?)(</pre>)}s', 'slippy_recode', $file);
echo $file;

/**
 * $highlighter must be false or a highlighter theme name
 * Available themes:
 *   Default, Django, Eclipse, Emacs, FadeToGrey, Midnight, RDark
 */
function slippy_init($match) {
    $highlighter = $match[1];
    $hlDir = dirname(__FILE__).'/highlighter/';
    $highlighter = ucfirst($highlighter);
    if (!is_dir($hlDir)) {
        throw new Exception('The highlighter files should be present in '.$hlDir);
    }
    if (!file_exists($hlDir.'shTheme'.$highlighter.'.css')) {
        throw new Exception('The chosen theme doesn\'t exist: '.$hlDir.'shTheme'.$highlighter.'.css');
    }

    return '
        <script type="text/javascript" src="jquery-1.4.2.min.js"></script>
        <script type="text/javascript" src="jquery.history.js"></script>
        <script type="text/javascript" src="slippy-'.SLIPPY_VERSION.'.js"></script>
        <link type="text/css" rel="stylesheet" href="slippy-'.SLIPPY_VERSION.'.css"/>
        <script type="text/javascript" src="highlighter/shCore.js"></script>
        <script type="text/javascript" src="highlighter/shBrushBash.js"></script>
        <script type="text/javascript" src="highlighter/shBrushCpp.js"></script>
        <script type="text/javascript" src="highlighter/shBrushCSharp.js"></script>
        <script type="text/javascript" src="highlighter/shBrushCss.js"></script>
        <script type="text/javascript" src="highlighter/shBrushDelphi.js"></script>
        <script type="text/javascript" src="highlighter/shBrushDiff.js"></script>
        <script type="text/javascript" src="highlighter/shBrushGroovy.js"></script>
        <script type="text/javascript" src="highlighter/shBrushJava.js"></script>
        <script type="text/javascript" src="highlighter/shBrushJScript.js"></script>
        <script type="text/javascript" src="highlighter/shBrushPhp.js"></script>
        <script type="text/javascript" src="highlighter/shBrushPlain.js"></script>
        <script type="text/javascript" src="highlighter/shBrushPython.js"></script>
        <script type="text/javascript" src="highlighter/shBrushRuby.js"></script>
        <script type="text/javascript" src="highlighter/shBrushScala.js"></script>
        <script type="text/javascript" src="highlighter/shBrushSql.js"></script>
        <script type="text/javascript" src="highlighter/shBrushVb.js"></script>
        <script type="text/javascript" src="highlighter/shBrushXml.js"></script>
        <link type="text/css" rel="stylesheet" href="highlighter/shCore.css"/>
        <link type="text/css" rel="stylesheet" href="highlighter/shTheme'.$highlighter.'.css"/>
        <script type="text/javascript">
            $(function() {
                $(".slide").slippy();
                SyntaxHighlighter.all();
            });
        </script>'.PHP_EOL;
}

/**
 * Strips the leading whitespace off <pre> tags and html encodes them
 */
function slippy_recode($match) {
    $whitespace = preg_replace('#^\r?\n?([ \t]+).*#s', '$1', $match[2]);
    $output = preg_replace('/^'.preg_quote($whitespace, '/').'/m', '', $match[2]);
    return $match[1] . htmlspecialchars($output) . $match[3];
}