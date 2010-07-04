<?php

/**
 * Slippy
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the new BSD License
 * See the LICENSE file for details
 *
 * Version: 0.9.0
 */

// init
$dir = dirname(__FILE__).'/';
if (file_exists($dir.'config.php')) {
    include $dir.'config.php';
    $dir = rtrim($dir, '/').'/';
}

// fetch slide deck
$file = $dir . (isset($_GET['file']) ? basename($_GET['file']) : 'index.html');

// list slide decks if none is not found
if (!file_exists($file) || !is_file($file)) {
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
$file = preg_replace_callback('{(<pre[^>]+>)(.+?)(</pre>)}s', 'slippy_recode', $file);
echo $file;

/**
 * Strips the leading whitespace off <pre> tags and html encodes them
 */
function slippy_recode($match) {
    $whitespace = preg_replace('#^\r?\n?([ \t]+).*#s', '$1', $match[2]);
    $output = preg_replace('/^'.preg_quote($whitespace, '/').'/m', '', $match[2]);
    return $match[1] . htmlspecialchars($output) . $match[3];
}