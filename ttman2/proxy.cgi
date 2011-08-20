#!/usr/bin/perl -w

use CGI;
use CGI::Carp 'fatalsToBrowser';
use LWP::UserAgent;
use HTTP::Request;
require HTTP::Headers;

$q = new CGI;

%params = $q->Vars;

$h = HTTP::Headers->new;
while (($key, $val) = each(%ENV)) {
	if ($key != 'HTTP_UA_CPU') {
		if ($key =~ m/^HTTP_(\w+)$/i) {
			$h->header($1, $val);
		}
	}
}

$h->authorization_basic($params{'login'}, $params{'password'}) if exists $params{'login'};

$r = HTTP::Request->new('GET', $params{'url'}, $h);

$ua = new LWP::UserAgent;
$rs = $ua->request($r);

$retval = $rs->as_string;
$retval =~ s|^HTTP/1.[01] ([^\n]+)|Status: $1|;
$retval =~ s|\n[^\r\n:]*Authenticate:[^\r\n]+||;
print $retval;