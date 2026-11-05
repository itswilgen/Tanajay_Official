<?php

namespace App\Models;

use App\Concerns\InvalidatesPublicCache;
use App\Concerns\PubliclyListed;
use App\Enums\Branch;
use Database\Factories\OfficialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An elected official of the City Government: the Mayor, the Vice Mayor, or a
 * member of the Sangguniang Panlungsod.
 *
 * @property int $id
 * @property Branch $branch
 * @property string $position
 * @property string|null $name null while the seat's holder is unconfirmed
 * @property string|null $photo_path disk-relative path on the `public` disk
 * @property string|null $committee
 * @property bool $is_principal
 * @property string|null $message
 * @property int $sort_order
 * @property bool $is_published
 * @property bool $is_demo
 */
#[Fillable([
    'branch', 'position', 'name', 'photo_path', 'committee', 'is_principal',
    'message', 'sort_order', 'is_published', 'is_demo',
])]
class Official extends Model
{
    /** @use HasFactory<OfficialFactory> */
    use HasFactory;

    use InvalidatesPublicCache;
    use PubliclyListed;

    protected function casts(): array
    {
        return [
            'branch' => Branch::class,
            'is_principal' => 'boolean',
            'sort_order' => 'integer',
            'is_published' => 'boolean',
            'is_demo' => 'boolean',
        ];
    }

    /** The URL the page loads the photograph from, if there is one. */
    public function photoUrl(): ?string
    {
        return $this->photo_path === null ? null : 'storage/'.$this->photo_path;
    }
}
