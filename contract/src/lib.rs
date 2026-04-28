#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Initialized,
    Question,
    Options,
    Votes,
    Voter(Address),
}

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq)]
#[repr(u32)]
pub enum PollError {
    AlreadyInitialized = 1,
    InvalidOptions = 2,
    InvalidOptionIndex = 3,
    AlreadyVoted = 4,
    NotInitialized = 5,
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn initialize_poll(env: Env, question: String, options: Vec<String>) {
        if env
            .storage()
            .instance()
            .get::<DataKey, bool>(&DataKey::Initialized)
            .unwrap_or(false)
        {
            panic_with_error(&env, PollError::AlreadyInitialized);
        }

        if options.is_empty() {
            panic_with_error(&env, PollError::InvalidOptions);
        }

        let mut votes = Vec::new(&env);
        for _ in 0..options.len() {
            votes.push_back(0u32);
        }

        let instance = env.storage().instance();
        instance.set(&DataKey::Question, &question);
        instance.set(&DataKey::Options, &options);
        instance.set(&DataKey::Votes, &votes);
        instance.set(&DataKey::Initialized, &true);
    }

    pub fn vote(env: Env, option_index: u32, voter: Address) {
        voter.require_auth();
        ensure_initialized(&env);

        let voter_key = DataKey::Voter(voter.clone());
        if env
            .storage()
            .persistent()
            .get::<DataKey, bool>(&voter_key)
            .unwrap_or(false)
        {
            panic_with_error(&env, PollError::AlreadyVoted);
        }

        let mut votes = env
            .storage()
            .instance()
            .get::<DataKey, Vec<u32>>(&DataKey::Votes)
            .unwrap();

        if option_index >= votes.len() {
            panic_with_error(&env, PollError::InvalidOptionIndex);
        }

        let current_votes = votes.get(option_index).unwrap_or(0);
        votes.set(option_index, current_votes + 1);

        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().persistent().set(&voter_key, &true);

        env.events().publish(
            (symbol_short!("vote_cast"),),
            (voter, option_index),
        );
    }

    pub fn get_results(env: Env) -> Vec<u32> {
        ensure_initialized(&env);
        env.storage()
            .instance()
            .get::<DataKey, Vec<u32>>(&DataKey::Votes)
            .unwrap()
    }

    pub fn has_voted(env: Env, voter: Address) -> bool {
        ensure_initialized(&env);
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&DataKey::Voter(voter))
            .unwrap_or(false)
    }
}

fn ensure_initialized(env: &Env) {
    if !env
        .storage()
        .instance()
        .get::<DataKey, bool>(&DataKey::Initialized)
        .unwrap_or(false)
    {
        panic_with_error(env, PollError::NotInitialized);
    }
}

fn panic_with_error(env: &Env, error: PollError) -> ! {
    soroban_sdk::panic_with_error!(env, error);
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn initialize_and_vote() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(PollContract, ());
        let client = PollContractClient::new(&env, &contract_id);

        let options = vec![
            &env,
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
        ];

        client.initialize_poll(&String::from_str(&env, "Ship it?"), &options);

        let voter = Address::generate(&env);
        client.vote(&0, &voter);

        let results = client.get_results();
        assert_eq!(results.get(0), Some(1));
        assert_eq!(results.get(1), Some(0));
        assert!(client.has_voted(&voter));
    }
}
