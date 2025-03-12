from django.db import migrations

def create_global_community(apps, schema_editor):
    Community = apps.get_model('app', 'Community')
    # Create or get the Global Community (News Feed)
    Community.objects.get_or_create(
        community_name="Global Community (News Feed)",
        description="This is the default global community used as a news feed for posts.",
        privacy="public"
    )

class Migration(migrations.Migration):

    dependencies = [
        # Ensure this dependency is set to the last migration
        ('app', '0005_alter_post_community'),
    ]

    operations = [
        migrations.RunPython(create_global_community),
    ]
