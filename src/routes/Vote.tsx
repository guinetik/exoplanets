/**
 * Vote Page - Earth 2.0 Poll
 * Users vote on their favorite habitable exoplanet candidate
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { pollService } from '../services';
import { UserPrompt } from '../components/Reviews/UserPrompt';
import Spinner from '../components/Spinner';
import type { Exoplanet, VoteCount } from '../types';
import { nameToSlug } from '../utils/urlSlug';
import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'VotePage' });

/** Number of candidates to show */
const TOP_CANDIDATES = 20;

export default function Vote() {
  const { t } = useTranslation();
  const { isLoading: dataLoading, getTopHabitable } = useData();
  const { profile, loading: authLoading } = useAuth();

  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [pendingVotePlanet, setPendingVotePlanet] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Get top habitable candidates, sorted by vote count (leaders first)
  const candidates = useMemo(() => {
    if (dataLoading) return [];
    const topPlanets = getTopHabitable(TOP_CANDIDATES);
    
    // Sort by vote count (descending), then by habitability score
    return [...topPlanets].sort((a, b) => {
      const votesA = voteCounts.find((vc) => vc.planet === a.pl_name)?.count || 0;
      const votesB = voteCounts.find((vc) => vc.planet === b.pl_name)?.count || 0;
      
      // Primary sort: votes (descending)
      if (votesB !== votesA) return votesB - votesA;
      
      // Secondary sort: habitability score (descending)
      return b.habitability_score - a.habitability_score;
    });
  }, [dataLoading, getTopHabitable, voteCounts]);

  // Load vote counts and user's vote
  useEffect(() => {
    async function loadVoteData() {
      setIsLoadingVotes(true);
      try {
        const [counts, total] = await Promise.all([
          pollService.getVoteCounts(),
          pollService.getTotalVotes(),
        ]);
        setVoteCounts(counts);
        setTotalVotes(total);

        // Load user's vote if logged in
        if (profile) {
          const vote = await pollService.getUserVote(profile.uid);
          setUserVote(vote?.planet || null);
        }
      } catch (err) {
        logger.error('Failed to load vote data:', err);
      } finally {
        setIsLoadingVotes(false);
      }
    }

    loadVoteData();
  }, [profile]);

  // Get vote count for a planet
  const getVoteCount = useCallback(
    (planetName: string): number => {
      const found = voteCounts.find((vc) => vc.planet === planetName);
      return found?.count || 0;
    },
    [voteCounts]
  );

  // Find the leader (planet with most votes)
  const leader = useMemo(() => {
    if (voteCounts.length === 0) return null;
    return voteCounts[0].planet;
  }, [voteCounts]);

  // Handle vote button click
  const handleVoteClick = useCallback(
    (planetName: string) => {
      if (!profile) {
        // User not authenticated, show prompt
        setPendingVotePlanet(planetName);
        setShowUserPrompt(true);
        return;
      }

      // User authenticated, cast vote
      castVote(planetName);
    },
    [profile]
  );

  // Cast a vote
  const castVote = useCallback(
    async (planetName: string) => {
      if (!profile || isVoting) return;

      setIsVoting(true);
      try {
        await pollService.castVote(planetName, profile.uid);
        setUserVote(planetName);

        // Refresh vote counts
        const [counts, total] = await Promise.all([
          pollService.getVoteCounts(),
          pollService.getTotalVotes(),
        ]);
        setVoteCounts(counts);
        setTotalVotes(total);

        logger.info('Vote cast successfully:', planetName);
      } catch (err) {
        logger.error('Failed to cast vote:', err);
      } finally {
        setIsVoting(false);
      }
    },
    [profile, isVoting]
  );

  // Handle user prompt submit (guest sign-in)
  const handleUserPromptSubmit = useCallback(
    (name: string) => {
      // Local user created, close prompt
      // The vote will be cast when auth state updates
      setShowUserPrompt(false);
      logger.info('Guest user created:', name);
    },
    []
  );

  // Handle user prompt close
  const handleUserPromptClose = useCallback(() => {
    setShowUserPrompt(false);
    // If user authenticated while prompt was open, cast pending vote
    if (profile && pendingVotePlanet) {
      castVote(pendingVotePlanet);
    }
    setPendingVotePlanet(null);
  }, [profile, pendingVotePlanet, castVote]);

  // Cast pending vote when user authenticates
  useEffect(() => {
    if (profile && pendingVotePlanet && !showUserPrompt) {
      castVote(pendingVotePlanet);
      setPendingVotePlanet(null);
    }
  }, [profile, pendingVotePlanet, showUserPrompt, castVote]);

  // Loading state
  if (dataLoading || authLoading) {
    return (
      <div className="vote-loading">
        <Spinner />
        <p>{t('pages.vote.loading')}</p>
      </div>
    );
  }

  return (
    <div className="vote-page">
      {/* Header */}
      <header className="vote-header">
        <h1 className="vote-title">{t('pages.vote.title')}</h1>
        <p className="vote-subtitle">{t('pages.vote.subtitle')}</p>
        <div className="vote-stats">
          <span className="vote-total">
            {t('pages.vote.totalVotes', { count: totalVotes })}
          </span>
          {userVote && (
            <span className="vote-your-pick">
              {t('pages.vote.yourPick', { planet: userVote })}
            </span>
          )}
        </div>
      </header>

      {/* Candidates Grid */}
      <section className="vote-grid">
        {candidates.map((planet, index) => (
          <VoteCard
            key={planet.pl_name}
            planet={planet}
            rank={index + 1}
            voteCount={getVoteCount(planet.pl_name)}
            isLeader={planet.pl_name === leader}
            isUserVote={planet.pl_name === userVote}
            isVoting={isVoting}
            onVote={() => handleVoteClick(planet.pl_name)}
          />
        ))}
      </section>

      {/* Loading overlay for votes */}
      {isLoadingVotes && !dataLoading && (
        <div className="vote-loading-overlay">
          <Spinner />
        </div>
      )}

      {/* User Prompt Modal */}
      {showUserPrompt && (
        <UserPrompt
          onSubmit={handleUserPromptSubmit}
          onClose={handleUserPromptClose}
        />
      )}
    </div>
  );
}

// =============================================================================
// Vote Card Component
// =============================================================================

interface VoteCardProps {
  planet: Exoplanet;
  rank: number;
  voteCount: number;
  isLeader: boolean;
  isUserVote: boolean;
  isVoting: boolean;
  onVote: () => void;
}

function VoteCard({
  planet,
  rank,
  voteCount,
  isLeader,
  isUserVote,
  isVoting,
  onVote,
}: VoteCardProps) {
  const { t } = useTranslation();

  const cardClass = [
    'vote-card',
    isLeader && voteCount > 0 ? 'vote-card-leader' : '',
    isUserVote ? 'vote-card-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {/* Rank Badge */}
      <div className="vote-rank">
        {isLeader && voteCount > 0 && <span className="vote-crown">👑</span>}
        #{rank}
      </div>

      {/* Planet Info */}
      <div className="vote-card-content">
        <Link
          to={`/planets/${nameToSlug(planet.pl_name)}`}
          className="vote-planet-name"
        >
          {planet.pl_name}
        </Link>

        <div className="vote-planet-score">
          <span className="score-value">
            {planet.habitability_score.toFixed(1)}
          </span>
          <span className="score-label">/ 100</span>
        </div>

        <div className="vote-planet-details">
          {planet.planet_type && (
            <span className="detail-item">{planet.planet_type}</span>
          )}
          {planet.distance_ly && (
            <span className="detail-item">
              {planet.distance_ly.toFixed(1)} {t('pages.vote.lightYears')}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="vote-badges">
          {planet.is_habitable_zone && (
            <span className="badge habitable">
              {t('pages.habitability.charts.badges.habitableZone')}
            </span>
          )}
          {planet.is_earth_like && (
            <span className="badge earth-like">
              {t('pages.habitability.charts.badges.earthLike')}
            </span>
          )}
        </div>
      </div>

      {/* Vote Section */}
      <div className="vote-card-footer">
        <div className="vote-count">
          <span className="vote-count-number">{voteCount}</span>
          <span className="vote-count-label">
            {t('pages.vote.votes', { count: voteCount })}
          </span>
        </div>

        <button
          className={`vote-button ${isUserVote ? 'vote-button-selected' : ''}`}
          onClick={onVote}
          disabled={isVoting}
        >
          {isUserVote
            ? t('pages.vote.voted')
            : t('pages.vote.voteButton')}
        </button>
      </div>

      {/* Selected Indicator */}
      {isUserVote && (
        <div className="vote-selected-badge">
          {t('pages.vote.yourChoice')}
        </div>
      )}
    </div>
  );
}

