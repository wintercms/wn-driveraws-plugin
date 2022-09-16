<?php

namespace Winter\DriverAWS\Classes;

use Aws\Signature\S3SignatureV4;

class WinterS3SignatureV4 extends S3SignatureV4
{
    protected function getHeaderBlacklist()
    {
        $list = parent::getHeaderBlacklist();

        unset(
            $list['content-type'],
            $list['content-length']
        );

        return $list;
    }
}
