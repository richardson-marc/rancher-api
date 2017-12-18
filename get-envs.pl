#!/usr/bin/perl



# this gets a list of environment IDs and names
use LWP::Simple;                # From CPAN
#use JSON qw( decode_json );     # From CPAN
use JSON;
#use Data::Dumper;               # Perl core module
use WWW::Curl::Easy;
#use strict;                     # Good practice
use warnings;                   # Good practice

use HTTP::Request::Common;


my $site = 'url';
my $user = "user";
my $pass = "pass";

my $curl= WWW::Curl::Easy->new;
#$curl->setopt(CURLOPT_VERBOSE,1); 
$curl->setopt(CURLOPT_HTTPAUTH,CURLAUTH_ANY);  
$curl->setopt(CURLOPT_USERPWD, "$user:$pass"); 
$curl->setopt(CURLOPT_URL, $site);
my $response;
$curl->setopt(WWW::Curl::Easy::CURLOPT_WRITEDATA(), \$response);
my $retcode = $curl->perform;

$output = $response;
#print "output is $output\n"; # 0
#use JSON::Parse 'parse_json';
#my $parsed_output = parse_json ($output);
#print "output is $output\n";
#use JSON qw( decode_json );     # From CPAN
my $decoded = decode_json($output);


my $json = JSON->new;
my $data = $json->decode($output);

for ( @{$data->{data}} ) {
    print $_->{name}."\t";
    print $_->{id}."\n";

}

__END__
#my @id = @{ $decoded->{'id'} };
#foreach my $i ( @id ) {
#    print $i->{"id"} . "\n";
#}
#__END__
use Data::Dumper;
# you'll get this (it'll print out); comment this when done.
#print Dumper [ grep id ($parsed_output) ];
print Dumper  $decoded;
#print Dumper $decoded_json; # this is a hash
#print "type of x: " . ref($decoded_json) . "\n";
#print "type of x: " . ref($parsed_output) . "\n";
#%hash = $parsed_output;
# nope
#while ( my ($key, $value) = each(%hash) ) {
#    print "$key => $value\n";
#}
#print "type of x: " . ref($decoded_json) . "\n";
#$Data::Dumper::Sortkeys = sub { [ sort grep { /^name|Id$/ } ] keys % };
__END__
# this works a treat

#print $parsed_output;# this is a hash
use Data::Dumper;
$Data::Dumper::Sortkeys = sub { [ sort grep { /^name|Id$/ } keys %
#print Dumper(\$output);
__END__
# beautiful
