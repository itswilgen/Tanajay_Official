<?php

namespace App\Models;

use App\Concerns\HasPoster;
use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A standing city programme — assistance, a service drive, a livelihood
 * scheme — written for the resident who might qualify: who it is for, what
 * it gives, which office runs it, and how to apply.
 *
 * @property int $id
 * @property string $title
 * @property string $summary
 * @property string $audience
 * @property string $office
 * @property string $how_to_apply
 * @property string|null $poster_path
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'title', 'summary', 'audience', 'office', 'how_to_apply', 'poster_path',
    'sort_order', 'is_published', 'is_demo',
])]
class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory;

    use HasPoster;
    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }
}
