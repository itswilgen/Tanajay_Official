<?php

namespace App\Models;

use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Database\Factories\AgendaItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One point of the Mayor's priority agenda, in the order the Mayor's office
 * numbers them.
 *
 * @property int $id
 * @property string $title
 * @property string $summary
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable(['title', 'summary', 'sort_order', 'is_published', 'is_demo'])]
class AgendaItem extends Model
{
    /** @use HasFactory<AgendaItemFactory> */
    use HasFactory;

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
