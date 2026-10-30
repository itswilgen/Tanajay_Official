<?php

namespace App\Enums;

/**
 * The lifecycle of a piece of publishable content. `posts` stores these exact
 * strings in its `status` column, and anything publishable added later should
 * reuse this enum rather than inventing a parallel set of states.
 */
enum PublicationStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
