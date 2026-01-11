export const typeDefs = `#graphql
  type Login {
    id: Int
    username: String
    role: String
    full_name: String
  }

  type DetailItem {
    username: String
    montant: String
  }

  type Chiffre {
    id: Int
    date: String
    recette_de_caisse: String
    total_diponce: String
    diponce: String # Stringified JSON
    diponce_divers: String # Stringified JSON
    diponce_journalier: String # Stringified JSON
    diponce_admin: String # Stringified JSON
    recette_net: String
    tpe: String
    cheque_bancaire: String
    espaces: String
    tickets_restaurant: String
    extra: String
    primes: String
    # Bey Database Fields
    avances_details: [DetailItem]
    doublages_details: [DetailItem]
    extras_details: [DetailItem]
    primes_details: [DetailItem]
  }

  type Supplier {
    id: Int
    name: String
  }

  type SalaryHistory {
    month: String
    total: Float
  }

  type PaidUser {
    username: String
    amount: Float
  }

  type Invoice {
    id: Int
    supplier_name: String
    amount: String
    date: String
    photo_url: String
    photo_cheque_url: String
    photo_verso_url: String
    status: String
    payment_method: String
    paid_date: String
  }

  type BankDeposit {
    id: Int
    amount: String
    date: String
  }

  type PaymentStats {
    totalRecetteNette: Float
    totalFacturesPayees: Float
    totalTPE: Float
    totalCheque: Float
    totalCash: Float
    totalBankDeposits: Float
  }

  type Query {
    getChiffreByDate(date: String!): Chiffre
    getChiffresByRange(startDate: String!, endDate: String!): [Chiffre]
    getSuppliers: [Supplier]
    getMonthlySalaries(startDate: String!, endDate: String!): [SalaryHistory]
    getPaidUsers(month: String, startDate: String, endDate: String): [PaidUser]
    getInvoices(supplierName: String, startDate: String, endDate: String, month: String): [Invoice]
    getPaymentStats(month: String, startDate: String, endDate: String): PaymentStats
    getBankDeposits(month: String, startDate: String, endDate: String): [BankDeposit]
  }

  type Mutation {
    saveChiffre(
      date: String!
      recette_de_caisse: String!
      total_diponce: String!
      diponce: String!
      diponce_divers: String!
      diponce_journalier: String!
      diponce_admin: String!
      recette_net: String!
      tpe: String!
      cheque_bancaire: String!
      espaces: String!
      tickets_restaurant: String!
      extra: String!
      primes: String!
    ): Chiffre
    
    upsertSupplier(name: String!): Supplier
    deleteSupplier(id: Int!): Boolean

    addInvoice(
      supplier_name: String!
      amount: String!
      date: String!
      photo_url: String
    ): Invoice

    payInvoice(
      id: Int!
      payment_method: String!
      paid_date: String!
      photo_cheque_url: String
      photo_verso_url: String
    ): Invoice

    deleteInvoice(id: Int!): Boolean
    
    addBankDeposit(
      amount: String!
      date: String!
    ): BankDeposit

    addPaidInvoice(
      supplier_name: String!
      amount: String!
      date: String!
      photo_url: String
      photo_cheque_url: String
      photo_verso_url: String
      payment_method: String!
      paid_date: String!
    ): Invoice
  }
`;
