#!/usr/bin/env python3
"""Seed the local SQLite database with minimal sample data for frontend testing.

Run this after starting the backend (or while not running — it will initialize tables).

Works from any working directory, e.g. `python backend/seed_sample_data.py` from the
repo root. backend/ is not a package and app.py uses flat imports, so put this file's
own directory on sys.path before importing from it.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from database import db
from models import (
    ReviewProject,
    Review,
    ReviewItem,
    ReviewStatus,
    Decision,
)


def seed():
    app = create_app()
    with app.app_context():
        # Create a sample project
        proj = ReviewProject(
            guid='00000000-0000-0000-0000-000000000001',
            collection_ids_json='[123]',
            collection_names_json='["Sample Collection"]',
            name='Sample Project',
            edit_metadata=True,
        )
        db.session.add(proj)
        db.session.commit()

        # Create a reviewer queue (Review) tied to the project
        review = Review(
            collection_id=123,
            collection_name='Sample Collection',
            status=ReviewStatus.IN_PROGRESS,
            name='Sample Review Queue',
            review_project_id=proj.id,
            queue_guid='sample-queue-guid-1',
            queue_index=0,
            edit_metadata=True,
        )
        db.session.add(review)
        db.session.commit()

        # Add a few review items
        items = [
            ReviewItem(
                review_id=review.id,
                source_id=1,
                source_label='Example News',
                source_homepage='https://example.com',
                is_new_source=False,
                decision=Decision.UNDECIDED,
            ),
            ReviewItem(
                review_id=review.id,
                source_id=2,
                source_label='Another Source',
                source_homepage='https://another.com',
                is_new_source=False,
                decision=Decision.UNDECIDED,
            ),
            ReviewItem(
                review_id=review.id,
                source_id=None,
                source_label='Proposed Source',
                source_homepage='https://new.example.org',
                is_new_source=True,
                decision=Decision.UNDECIDED,
            ),
        ]
        db.session.add_all(items)
        db.session.commit()

        print('Seed complete: project guid=', proj.guid)
        print('Review id=', review.id)


if __name__ == '__main__':
    seed()
