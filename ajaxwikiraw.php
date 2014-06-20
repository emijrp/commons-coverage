<?php
    if (isset($_GET['file'])) {
        $url='https://commons.wikimedia.org/w/index.php?title=File:'.$_GET['file'].'&action=raw';
        exit(file_get_contents($url));
    }
?>
