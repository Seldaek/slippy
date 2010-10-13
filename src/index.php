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
$repositoryTemplate = 'repo.php';
if (file_exists($dir.'config.php')) {
    include $dir.'config.php';
    $dir = rtrim($dir, '/').'/';
}

// fetch slide deck
$file = $dir . (isset($_GET['file']) ? basename($_GET['file']) : 'index.html');

// list slide decks if none is not found
if (!file_exists($file) || !is_file($file) || !is_readable($file)) {
    $decks = array_reverse(glob($dir.'*.html'));
    $decks = fetchDecksData($decks);

    include $repositoryTemplate;
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
    $whitespace = preg_replace('#^\r?\n?([ \t]*).*#s', '$1', $match[2]);
    $output = preg_replace('/^'.preg_quote($whitespace, '/').'/m', '', $match[2]);
    return $match[1] . htmlspecialchars($output) . $match[3];
}

/**
 * Fetches the data of each deck file passed to it
 */
function fetchDecksData($decks)
{
    foreach ($decks as $idx => $file) {
        $decks[$idx] = array(
            'file' => $file,
            'filename' => basename($file, '.html'),
        );
        $content = file_get_contents($file);
        $content = preg_replace('#</head>.*#s', '</head>', $content) . '</html>';
        if ($content = simplexml_load_string($content)) {
            foreach ($content->head->meta as $meta) {
                if (!$meta->attributes()->name) {
                    continue;
                }
                $name = $meta->attributes()->name->__toString();
                if (in_array($name, array('venue', 'date', 'author', 'email'))) {
                    $decks[$idx][$name] = $meta->attributes()->content->__toString();
                }
            }
            $decks[$idx]['topic'] = $content->head->title->__toString();
        }
        if (!isset($decks[$idx]['topic']) || !$decks[$idx]['topic']) {
            $decks[$idx]['topic'] = $decks[$idx]['filename'];
        }
    }
    return $decks;
}