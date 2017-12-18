#!/usr/bin/perl

use Getopt::Long;
use WWW::Curl::Easy;
use JSON;


GetOptions ("vnet=s" => \$vnet,    # numeric
	    "stack=s" => \$stack,
              "env=s"   => \$env,      # string
              "verbose"  => \$verbose);   # flag


my $file = './serviceids';
my $file2 = './projectIds';


open( my $input_fh2, "<", $file2 ) || die "Can't open $file: $!";
while (my $projectid= <$input_fh2>) {


open( my $input_fh, "<", $file ) || die "Can't open $file: $!";
open (my $file) or die "can't open $file\n";

while (my $serviceid = <$input_fh>) {
#print "$row\n";
curl($projectid,$serviceid)
}
}
#__END__


sub curl{
    print "url is https://URL/v1/projects/$projectid/services/$serviceid";
my $envs_url = "https://URL/v1/projects/$projectid/services/$serviceid";
my $user = "user";
my $pass = "pass";

my $curl= WWW::Curl::Easy->new;

#print "my vnet is $vnet\n";
#print "envs url is $envs_url\n";

#$curl->setopt(CURLOPT_VERBOSE,1);
$curl->setopt(CURLOPT_HTTPAUTH,CURLAUTH_ANY);
$curl->setopt(CURLOPT_USERPWD, "$user:$pass");
$curl->setopt(CURLOPT_URL, $envs_url);
my $response;
$curl->setopt(WWW::Curl::Easy::CURLOPT_WRITEDATA(), \$response);
my $retcode = $curl->perform;

my $decoded = decode_json($response);


my $json = JSON->new;
my $data = $json->decode($response);
use JSON qw( decode_json );
my $decoded = decode_json($response);


my $decoded_json = decode_json( $response );

if ($retcode == 0) {
#    print("Transfer went ok\n");
    my $response_code = $curl->getinfo(CURLINFO_HTTP_CODE);
                # judge result and next action based on $response_code
#    print("Received response: $response\n");
    print("$response\n");
} else {
                # Error code, type of error, error message
    print("An error happened: $retcode ".$curl->strerror($retcode)." ".$curl->errbuf."\n");
}

# you'll get this (it'll print out); comment this when done.
print Dumper $decoded_json; # nope

}
#__END__

print "name\tstackid\n";
for ( @{$data->{data}} ) {
#    print "stack is $stack\t vnet is $_->{name}\n";
#    if ($_->{name} =~ /$stack/) {
    print $_->{name}."\t";
    $name = $_->{name};
    print $_->{id}."\n";
    $id = $_->{id};
    $hash{$name} = $id;
#    }
}
#use Data::Dumper;
#print Dumper %hash;
#for my $name (keys %hash) {
#    print "The id of '$name' is $hash{$name}\n";
#}


# parse the environment ID from the given vnet
$ourenv = $hash{$vnet};
print "ourenv is $ourenv\n";
### now we get the stacks for the given environment
chomp $ourenv;
#my $stacks_url = "https://rancher.leankit.io/v1/projects/$ourenv/environments";
# api not returning again...
my $stacks_url = "https://rancher.leankit.io/v1/projects/1a88372/environments";
print "stacks url is $stacks_url\n";
#$curl->setopt(CURLOPT_VERBOSE,1);
$curl->setopt(CURLOPT_HTTPAUTH,CURLAUTH_ANY);
$curl->setopt(CURLOPT_USERPWD, "$user:$pass");
$curl->setopt(CURLOPT_URL, $stacks_url);
my $response;
$curl->setopt(WWW::Curl::Easy::CURLOPT_WRITEDATA(), \$newresponse);
my $retcode = $curl->perform;
#print "url is $stacks_url\n";
$newoutput = $newresponse;
my $newdecoded = decode_json($newoutput);


my $json = JSON->new;
my $newdata = $json->decode($newoutput);

#print "$newdata\n";
print "######################################\n";
use Data::Dumper;
#print Dumper $newdata;

#for ( my $i = 0; $i <= $#{ $newdata }; $i++ )
#{
#    print "$newdata->[$i] \n";
#}
#print " this is a \n"; #HASH
print "type of x: " . ref($newdata) . "\n";
my @keys = keys % { $newdata };

#print "keys @keys\n"; # top level of hash
my %hash = %{$newdata};
print "all the stuff\n";

#use Data::Dumper;
#print Dumper %hash;
for ( sort  keys %hash ) {
    my $first_lvl = $hash{$_};
    if ($_ =~ /actions/) {
	print "\t\t first is $_\n";

	print "\t\t\t$hash{$_}\n"; # a hash
    }
    print "first $_\n";

#    for ( keys %{ $first_lvl } ) {
#	my $second_lvl = $first_lvl->{$_};
#      print 'second  x 3' . $second_lvl . "\n";

#      for ( keys %{ $second_lvl } ) {
#         print ' ' x 6 . "$_ : $second_lvl->{$_}\n";
#      }
#   } # END for keys $first_lvl
}    # END for keys %category_hash

__END__
show(\%newdata, 0);

sub show {
    my ($hash, $lvl) = @_;

    my $prefix = '  ' x $lvl;

    foreach (sort keys %$hash) {
	print "$prefix$_ : $hash->{$_}{name}\n";
	show($hash->{$_}{children}, ++$lvl)
	    if exists $hash->{$_}{children};
    }
}
__END__
# this actually fairly works, but only handles 2 dimensional hashes
sub print_hash {
    # href = reference to the hash we're examining (i.e. \%extend_hash)
    # so_far = arrayref containing the hash keys we are accessing
    my $newdata = shift;
    my $so_far = shift;
    foreach my $k (keys %$newdata) {
        # put $k on to the array of keys
        push @$so_far, $k;
        # if $href->{$k} is a reference to another hash, call print_hash on that hash
        if (ref($newdata->{$k}) eq 'HASH') {
            print_hash($newdata->{$k}, $so_far);
        } else {
        # $href->{$k} is a scalar, so print out @$so_far (our list of hash keys)
        # and the value in $href->{$k}
            print join(", ", @$so_far, ,"value:", $newdata->{$k}) . "\n";
        }
        # we've finished looking at $href->{$k}, so remove $k from the array of keys
        pop @$so_far;
    }
}
#print_hash($newdata, []);

foreach my $l1 (keys %$newdata) { # ok
    print "l1 is $l1\n";
    foreach my $l2 (keys %{$newdata{$l1}}) {
	print "type of newdata: " . ref($newdata{$l1}) . "\n";
	print "l2 is $l2\t value is $newdata{$l1}{$l2}\n";
    }
}

#print "id = " . $newdecoded->{'data'}{'id'} . "\n";
#my @stuff = @{ $newdecoded->{'data'} };
foreach my $f ( @stuff ) {
    print $f->{"data"} . "\n";
}
__END__
use Data::Dumper;
Dump %$newdata;

#for my $name (keys %newdata) {
#    print "The id of '$name' is $hash{$name}\n";
#}

#for my $name (keys %hash) {
#    print "The id of '$name' is $hash{$name}\n";
#}
print "newdata $newdata\n"; # a hash
# it's actually a hashref


foreach my $l1 (keys %$newdata) {
    # '6'
    foreach my $l2 (keys %{$newdata{$l1}}) {
        # IACI, MCHP, BC, etc.
	print "$l1, $l2" . $newdata{$l1}{$l2} . "\n";
#        foreach my $l3 (keys %{$newdata{$l1}{$l2}}) {
            # ARCX, AMXO, XISX, etc.
#            foreach my $k (keys %{$newdata{$l1}{$l2}{$l3}}) {
#                print "$l1, $l2, $l3, $k, " . $newdata{$l1}{$l2}{$l3}{$k} . "\n";
#            }
        }
}
#}
#print "$_ $h{$_}\n" for (keys %$newdata);
# top level keys
# we want stuff under the data key
 # this is from the old data structure
# for ( @{$newdata->{data}} ) {
 for ( @{$newdata->{newdata}} ) {
     # correct
#     print $_->{accountId}."\t";
#     $account = $_->{accountId};
# #    print "account is $account\n";
#     print $_->{name}."\t";
# correct
#     $name = $_->{name};
#    print "name is $name\n";
# name of the environment, not the stack
#     $newhash{$stack} = $name;
# #    push 
    print "name is $name\n";
# this is the stack's id
     print $_->{id}."\n";
     $id = $_->{id};
     $stack_id = $id;
#    print "this is id\t";
#id is the id of the stack
    print "id is $id\n";
     $hash{$accountid} = $id;

     $ranchercompose = $_->{rancherCompose};
     my @stuff = split "\n", $ranchercompose;

#     my %hash = split /[:]/, $string;

     my %hash;
     $hash{$_}++ for (@stuff);
#     print "stuff is @stuff\n";
     #description is taken from the rancher-catalog github repo
#print "$stuff[3]\n";
#print
#     $variable = "version";
#     for (keys %hash) {
#	 print $hash{$_}, $/ if $variable =~ /$_/;
#     }
#     print "$_ $hash{$_}\n" for keys %hash;
#     print "We have some apps\n" if /.*app$/ ~~ %hash;
     #print "id:\t$id\n";

#     my %hash = split (':', @stuff);
#     use Data::Dumper;
#     print Dumper \%hash;
#version: v4.8.1' => 1,
#key  is version vxxxx
# need to split this

#     print "@stuff\n";
#     print "name is $stuff[3]\n";
#     print "version is $stuff[2]\n";
#     print "something is $stuff[5]\n";
#.catalog:   name: master   version: v1.3.0   description: leankit.analytics   uuid: master-54    leankit.analytics:   scale: 1   load_balancer_config:     haproxy_config: {}   health_check:     port: 42     interval: 10000     strategy: none     unhealthy_threshold: 2     healthy_threshold: 2     response_timeout: 2000   upgrade_strategy:     batch_size: 1     interval_millis: 30000    leankit.analytics-app:   scale: 1   health_check:     port: 8300     interval: 10000     strategy: none     unhealthy_threshold: 2     request_line: GET /analytics/api/_status HTTP/1.1     healthy_threshold: 2     response_timeout: 2000   upgrade_strategy:     batch_size: 1     interval_millis: 30000
#.catalog:   name: master   version: v1.3.0   description: leankit.tableau   uuid: master-12    leankit.tableau:   scale: 1   load_balancer_config:     haproxy_config: {}   health_check:     port: 42     interval: 10000     strategy: none     unhealthy_threshold: 2     healthy_threshold: 2     response_timeout: 2000   upgrade_strategy:     batch_size: 1     interval_millis: 30000    leankit.tableau-app:   scale: 1   health_check:     port: 8400     interval: 10000     strategy: none     unhealthy_threshold: 2     request_line: GET /_status HTTP/1.1     healthy_threshold: 2     response_timeout: 2000   upgrade_strategy:     batch_size: 1     interval_millis: 30000


# this is a big blob of stuff, but has the tag
#version: v4.8.1
 # description: board.ui are of interest
#     print "rancher compose is $ranchercompose\n";
# nope


 }



__END__
#use Data::Dumper;
#dump %newhash;
print "stack is $stack\n";
# name of the stack, that is correct I think
#print "what is  $newhash{$stack}\n";
#__END__
# now we get info about continers for each stack
# this is for all stacks in the environment
$containers_url = "https://rancher.leankit.io/v1/projects/$ourenv/environments/$stack_id/services";
print "we want $hash{$accountid}\n";
# it should be 
#environment undefined
# have to map environment back from stack...
# 1a88372 is not in this URL.  Will need to pull it from newdata...
# $stack_id is the last one in the list...
print "url is https://rancher.leankit.io/v1/projects/$ourenv/environments/$stack_id/services\n";
print "url actually $containers_url\n";
#my $continers_url = "https://rancher.leankit.io/v1/projects/$ourenv/environments/$environment/services"; to get it for just one service
#$curl->setopt(CURLOPT_VERBOSE,1);
$curl->setopt(CURLOPT_HTTPAUTH,CURLAUTH_ANY);
$curl->setopt(CURLOPT_USERPWD, "$user:$pass");
$curl->setopt(CURLOPT_URL, $containers_url);
my $response;
$curl->setopt(WWW::Curl::Easy::CURLOPT_WRITEDATA(), \$response);
my $retcode = $curl->perform;

#my $decoded = decode_json($response);


my $json = JSON->new;
my $newnewdata = $json->decode($response);
# a hash
print "newnewdata is $newnewdata\n";

#print "New New data is $newnewdata\n"; a hash of course
for my $name (keys %newnewdata) {
    print "The id of '$name' is $hash{$name}\n";
}
# need a new hash
use Data::Dumper;
#print "Dumping...\n";
# this is for all stacks, not just board ui...
#print Dumper $newnewdata;
for ( @{$newnewdata->{data}} ) {
    print "id\t"; # id of the service
    print $_->{id}."\t";
    print "name\t"; # id of the service
    print $_->{name}."\t";
    print "accountID\t";
	print $_->{accountId}."\t";
#    print "imageUuid ";
#    print $_{imageUuid}."\n";
}
#while (my($k, $v) = each (%newnewdata)){
#    print "$k => $v\n";
#}
#print "trying this\n";
# this never does anything...
foreach my $imageUuid ( @{ $newnewdata->{launchConfig}{imageUuid} } )
{
    # here $cat is a hash reference
    print "image uuid $imageUuid\n";
 
}
__END__
for ( @{$newnewdata->{data}} ) {
#    print $_->{accountId}."\t";
#    $account = $_->{accountId};
#    print "account is $account\n";
#    print $_->{name}."\t";
#    $name = $_->{name};
#    print "name is $name\n";
# $id is from the previous hash 
    print "id\t";
    print $_->{id}."\n";
    $id = $_->{id};

    print "\tname\t";
    print $_->{name}."\t";
    $name = $_->{name};

#    print $_->{rancherCompose}."\n";
# image Uuid is not at the same level as other objects
# it is under LaunchConfig
    print "\t\tlaunchconfig\t";
    print $_->{launchConfig}."\t";
    $launchConfig = $_->{launchConfig};
    print "$launchConfig";
    print "\n";
    print "imageUuid\t";
    print $_->{imageUuid}."\t";
    $imageUuid = $_->{imageUuid};
    print "$imageUuid";
    print "\n";

#    $rancherCompose = $_{rancherCompose};
#    print "id is $id\n";
#    print $imageUuid."\n";
#    $hash{$accountid} = $id;
}


my @stuff = @{ $decoded->{'launchConfig'} };
foreach my $s ( @launchConfig ) {
    print "uuid\n";
    print $s->{"imageUuid"} . "\n";
}

