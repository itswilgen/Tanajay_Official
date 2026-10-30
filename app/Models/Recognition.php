<?php

namespace App\Models;

use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use Database\Factories\RecognitionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An award, seal or certification conferred on the City Government by
 * another body — the conferring body and the year are part of the claim, so
 * both are required.
 *
 * @property int $id
 * @property string $title
 * @property string $conferred_by
 * @property int $year
 * @property string|null $badge_path disk-relative path on the `public` disk
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'title', 'conferred_by', 'year', 'badge_path', 'sort_order', 'is_published',
    'is_demo',
])]
class Recognition extends Model
{
    /** @use HasFactory<RecognitionFactory> */
    use HasFactory;

    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }

    /** The URL the page loads the badge from, if there is one. */
    public function badgeUrl(): ?string
    {
        return $this->badge_path === null ? null : 'storage/'.$this->badge_path;
    }
}
