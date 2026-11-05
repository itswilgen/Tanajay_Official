<?php

namespace App\Enums;

/**
 * The branch of city government an official sits in. Under the Local
 * Government Code the Vice Mayor presides over the Sangguniang Panlungsod, so
 * the Vice Mayor is legislative, not executive — which is why this is stored
 * rather than inferred from a title.
 */
enum Branch: string
{
    case Executive = 'executive';
    case Legislative = 'legislative';
}
