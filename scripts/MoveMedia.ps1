[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$bucket = '',
    [Parameter(Mandatory=$true)]
    [bool]$toFsx = 1,
    [Parameter(Mandatory=$true)]
    [string[]]$files = '',
    [Parameter(Mandatory=$true)]
    [string]$fsxmount = ''
)

If (!(Test-Path F:)) {
    New-PSDrive –Name “F” –Root $fsxMount –PSProvider FileSystem
}

cd F:
foreach ($file in $files) {
    If ($toFsx) {
        aws s3 cp s3://$bucket/$file .\Media\
    } else {
        $dispKey = $file.Split('/')[-1]
        rm .\Media\$dispKey
        echo "upload s3://$($bucket)/$($file)"
    }
}