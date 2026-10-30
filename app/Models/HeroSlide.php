<?php

namespace App\Models;

use App\Concerns\InvalidatesPublicCache;
use Database\Factories\HeroSlideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One photograph in the landing page banner, published by the City
 * Information Office.
 *
 * @property int $id
 * @property string $title
 * @property string $category
 * @property string $description
 * @property string $alt_text
 * @property string $image_path disk-relative path on the `public` disk
 * @property int $sort_order
 * @property bool $is_published
 */
#[Fillable(['title', 'category', 'description', 'alt_text', 'image_path', 'sort_order', 'is_published'])]
class HeroSlide extends Model
{
    /** @use HasFactory<HeroSlideFactory> */
    use HasFactory;

    use InvalidatesPublicCache;

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
