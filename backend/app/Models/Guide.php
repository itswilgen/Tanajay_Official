<?php

namespace App\Models;

use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Database\Factories\GuideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A "How do I…" guide: one task a resident comes to City Hall to do, written
 * as the steps to take, what to bring, what it costs, how long it takes, and
 * which office handles it.
 *
 * @property int $id
 * @property string $title
 * @property string $summary
 * @property list<string> $steps
 * @property list<string> $requirements
 * @property string|null $fee
 * @property string|null $processing_time
 * @property string $office
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'title', 'summary', 'steps', 'requirements', 'fee', 'processing_time',
    'office', 'sort_order', 'is_published', 'is_demo',
])]
class Guide extends Model
{
    /** @use HasFactory<GuideFactory> */
    use HasFactory;

    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'steps' => 'array',
            'requirements' => 'array',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }
}
